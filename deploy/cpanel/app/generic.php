<?php
declare(strict_types=1);

/* Generic handlers for the catalog, organization and accounting resources.
 * Keeping these in one small adapter makes the cPanel build easy to extend
 * while all writes still use PDO prepared statements and soft deletion. */
function generic_dispatch(string $method, string $path): bool
{
    $map = [
        'brands'=>'brands','series'=>'item_series','warehouses'=>'warehouses','services'=>'services',
        'business-documents'=>'business_documents','account-categories'=>'account_categories',
        'cash-boxes'=>'cash_boxes','opening-debts'=>'opening_debts','payments'=>'payments',
        'financial-entries'=>'financial_entries','currencies'=>'currencies','quota-ratios'=>'quota_ratios',
        'settings'=>'module_settings','workplaces'=>'workplaces','groups'=>'user_groups',
        'users'=>'users','employees'=>'employees','drivers'=>'drivers','stock-transfers'=>'stock_transfers',
        'stock-movements'=>'stock_movements',
    ];
    if (preg_match('#^/stock-transfers(?:/([1-9][0-9]*))?$#', $path, $tm)) {
        generic_transfer($method, isset($tm[1]) ? (int)$tm[1] : null);
        return true;
    }
    if (preg_match('#^/business-documents/([1-9][0-9]*)$#', $path, $dm) && $method === 'PATCH') {
        generic_document_patch((int)$dm[1]);
        return true;
    }
    if ($path === '/session/login' && $method === 'POST') { generic_login(); return true; }
    if ($path === '/session/logout' && $method === 'POST') { auth_logout(); }
    if ($path === '/session/users' && $method === 'GET') {
        $rows = db()->query("SELECT id, username, display_name, status FROM users WHERE deleted_at IS NULL AND status='active' ORDER BY display_name, id")->fetchAll();
        json_response(array_map('auth_public_user', $rows));
    }
    if ($path === '/session/me' && $method === 'GET') {
        $user = auth_require();
        json_response(auth_public_user($user));
    }
    if ($path === '/session/bootstrap' && $method === 'POST') { generic_bootstrap(); return true; }
    if ($path === '/session/password' && $method === 'POST') { generic_password(); return true; }
    if (preg_match('#^/(brands|series|warehouses|services|business-documents|account-categories|cash-boxes|opening-debts|payments|financial-entries|currencies|quota-ratios|settings|workplaces|groups|users|employees|drivers|stock-transfers|stock-movements)(?:/([1-9][0-9]*))?(?:/restore)?$#', $path, $m)) {
        $resource=$m[1]; $id=isset($m[2])?(int)$m[2]:null;
        if (str_ends_with($path,'/restore') && $method==='POST') { generic_restore($map[$resource],$id); return true; }
        generic_crud($method,$map[$resource],$resource,$id); return true;
    }
    if (str_starts_with($path,'/reports/')) { generic_report($path); return true; }
    if ($path === '/deleted-records' && $method==='GET') { generic_deleted(); return true; }
    return false;
}

function generic_transfer(string $method, ?int $id): never
{
    $pdo = db();
    if ($method === 'GET') { generic_crud('GET', 'stock_transfers', 'stock-transfers', $id); }
    if ($method === 'DELETE' && $id !== null) {
        $pdo->beginTransaction();
        try {
            $s = $pdo->prepare("SELECT status FROM stock_transfers WHERE id=:id FOR UPDATE");
            $s->execute(['id'=>$id]); $row = $s->fetch();
            if (!$row) throw new DomainException('Stock transfer not found.');
            if ($row['status'] === 'completed') throw new DomainException('Completed stock transfers cannot be deleted.');
            $pdo->prepare("UPDATE stock_transfers SET status='cancelled' WHERE id=:id")->execute(['id'=>$id]);
            $pdo->commit(); http_response_code(204); exit;
        } catch (DomainException $e) { if ($pdo->inTransaction()) $pdo->rollBack(); error_response($e->getMessage(), 400); }
    }
    $body = json_body();
    if ($method === 'PATCH' && $id !== null) {
        $pdo->beginTransaction();
        try {
            $s=$pdo->prepare('SELECT * FROM stock_transfers WHERE id=:id FOR UPDATE');$s->execute(['id'=>$id]);$old=$s->fetch();
            if (!$old) throw new DomainException('Stock transfer not found.');
            if ($old['status']==='completed') throw new DomainException('Completed stock transfers cannot be changed.');
            $status=$body['status']??$old['status'];
            if (!in_array($status,['draft','cancelled','completed'],true)) throw new DomainException('Invalid transfer status.');
            $from=integer_value($body['fromWarehouseId']??$old['from_warehouse_id'],'fromWarehouseId');
            $to=integer_value($body['toWarehouseId']??$old['to_warehouse_id'],'toWarehouseId');
            $lines=array_key_exists('lines',$body)?$body['lines']:generic_transfer_lines($pdo,$id);
            generic_apply_transfer($pdo,$from,$to,$lines,$status==='completed',$id);
            $s=$pdo->prepare('UPDATE stock_transfers SET from_warehouse_id=:f,to_warehouse_id=:t,transfer_date=:d,note=:n,status=:s WHERE id=:id');
            $s->execute(['f'=>$from,'t'=>$to,'d'=>date_value($body['transferDate']??$old['transfer_date'],'transferDate'),'n'=>(string)($body['note']??$old['note']),'s'=>$status,'id'=>$id]);
            if (array_key_exists('lines',$body)) { $pdo->prepare('DELETE FROM stock_transfer_lines WHERE transfer_id=:id')->execute(['id'=>$id]); generic_insert_transfer_lines($pdo,$id,$lines); }
            $pdo->commit(); generic_crud('GET','stock_transfers','stock-transfers',$id);
        } catch (DomainException $e) { if ($pdo->inTransaction())$pdo->rollBack();error_response($e->getMessage(),400); }
        catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }
    if ($method === 'POST') {
        $from=integer_value($body['fromWarehouseId']??null,'fromWarehouseId');$to=integer_value($body['toWarehouseId']??null,'toWarehouseId');
        $lines=$body['lines']??null;if($from===$to||!is_array($lines)||count($lines)<1)error_response('Transfer warehouses must be distinct and lines are required.',400);
        $pdo->beginTransaction();
        try{$date=date_value($body['transferDate']??null,'transferDate');$st=(string)($body['status']??'draft');if(!in_array($st,['draft','completed','cancelled'],true))throw new DomainException('Invalid transfer status.');$s=$pdo->prepare('INSERT INTO stock_transfers (from_warehouse_id,to_warehouse_id,transfer_date,note,status) VALUES (:f,:t,:d,:n,:s)');$s->execute(['f'=>$from,'t'=>$to,'d'=>$date,'n'=>(string)($body['note']??''),'s'=>$st]);$new=(int)$pdo->lastInsertId();generic_apply_transfer($pdo,$from,$to,$lines,$st==='completed',$new);generic_insert_transfer_lines($pdo,$new,$lines);$pdo->commit();generic_crud('GET','stock_transfers','stock-transfers',$new);}catch(DomainException $e){if($pdo->inTransaction())$pdo->rollBack();error_response($e->getMessage(),400);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }
    error_response('Method not allowed.',405);
}
function generic_transfer_lines(PDO $pdo,int $id): array {$s=$pdo->prepare('SELECT item_id AS itemId,quantity FROM stock_transfer_lines WHERE transfer_id=:id');$s->execute(['id'=>$id]);return $s->fetchAll();}
function generic_insert_transfer_lines(PDO $pdo,int $id,array $lines): void {foreach($lines as $l){$item=integer_value($l['itemId']??null,'itemId');$qty=number_value($l['quantity']??null,'quantity',true);$s=$pdo->prepare('INSERT INTO stock_transfer_lines (transfer_id,item_id,quantity) VALUES (:t,:i,:q)');$s->execute(['t'=>$id,'i'=>$item,'q'=>$qty]);}}
function generic_apply_transfer(PDO $pdo,int $from,int $to,array $lines,bool $complete,int $transferId): void {
    if($from===$to||count($lines)<1)throw new DomainException('Transfer warehouses must be distinct and lines are required.');
    foreach($lines as $l){$item=integer_value($l['itemId']??null,'itemId');$qty=number_value($l['quantity']??null,'quantity',true);if($qty<=0)throw new DomainException('Transfer quantity must be positive.');
        $q=$pdo->prepare('SELECT quantity FROM warehouse_stock WHERE warehouse_id=:w AND item_id=:i FOR UPDATE');$q->execute(['w'=>$from,'i'=>$item]);$src=$q->fetch();if(!$src||$complete&&(float)$src['quantity']<$qty)throw new DomainException('Insufficient stock for transfer.');
        if($complete){$pdo->prepare('INSERT INTO warehouse_stock (warehouse_id,item_id,quantity) VALUES (:w,:i,0) ON DUPLICATE KEY UPDATE quantity=quantity')->execute(['w'=>$to,'i'=>$item]);$pdo->prepare('UPDATE warehouse_stock SET quantity=quantity-:q WHERE warehouse_id=:w AND item_id=:i')->execute(['q'=>$qty,'w'=>$from,'i'=>$item]);$pdo->prepare('UPDATE warehouse_stock SET quantity=quantity+:q WHERE warehouse_id=:w AND item_id=:i')->execute(['q'=>$qty,'w'=>$to,'i'=>$item]);$m=$pdo->prepare('INSERT INTO stock_movements (warehouse_id,item_id,movement_date,type,quantity,reference_type,reference_id,note) VALUES (:w,:i,UTC_DATE(),:t,:q,:r,:id,:n)');$m->execute(['w'=>$from,'i'=>$item,'t'=>'transfer_out','q'=>-$qty,'r'=>'stock_transfer','id'=>$transferId,'n'=>'Transfer out']);$m->execute(['w'=>$to,'i'=>$item,'t'=>'transfer_in','q'=>$qty,'r'=>'stock_transfer','id'=>$transferId,'n'=>'Transfer in']);}
    }
}
function generic_document_patch(int $id): never {
    $pdo=db();$b=json_body();$pdo->beginTransaction();
    try{$s=$pdo->prepare('SELECT * FROM business_documents WHERE id=:id AND deleted_at IS NULL FOR UPDATE');$s->execute(['id'=>$id]);if(!$s->fetch())throw new DomainException('Business document not found.');
        $cols=['workplaceId'=>'workplace_id','warehouseId'=>'warehouse_id','accountId'=>'account_id','kind'=>'kind','number'=>'number','documentDate'=>'document_date','validUntil'=>'valid_until','paymentType'=>'payment_type','currency'=>'currency','status'=>'status','discount'=>'discount','tax'=>'tax','total'=>'total','paidAmount'=>'paid_amount','notes'=>'notes'];$set=[];$p=['id'=>$id];
        foreach($cols as $k=>$c)if(array_key_exists($k,$b)){$set[]="`$c`=:$c";$p[$c]=$k==='documentDate'||$k==='validUntil'?date_value($b[$k],$k):$b[$k];}
        if(array_key_exists('lines',$b)){if(!is_array($b['lines'])||count($b['lines'])<1)throw new DomainException('At least one document line is required.');$pdo->prepare('DELETE FROM business_document_lines WHERE document_id=:id')->execute(['id'=>$id]);foreach($b['lines'] as $l){$item=$l['itemId']??null;$q=number_value($l['quantity']??null,'quantity',true);$price=number_value($l['unitPrice']??null,'unitPrice',true);if($q<=0)throw new DomainException('Document quantity must be positive.');$pdo->prepare('INSERT INTO business_document_lines (document_id,item_id,warehouse_id,description,quantity,unit_price,discount,tax,line_total) VALUES (:d,:i,:w,:x,:q,:p,:di,:t,:lt)')->execute(['d'=>$id,'i'=>$item?:null,'w'=>$l['warehouseId']??null,'x'=>(string)($l['description']??''),'q'=>$q,'p'=>$price,'di'=>number_value($l['discount']??0,'discount',true),'t'=>number_value($l['tax']??0,'tax',true),'lt'=>number_value($l['lineTotal']??($q*$price),'lineTotal',true)]);}}
        if($set){$pdo->prepare('UPDATE business_documents SET '.implode(',',$set).',updated_at=UTC_TIMESTAMP(3) WHERE id=:id')->execute($p);}$pdo->commit();generic_crud('GET','business_documents','business-documents',$id);
    }catch(DomainException $e){if($pdo->inTransaction())$pdo->rollBack();error_response($e->getMessage(),400);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}
function generic_table_row(array $row): array {
    $out=[];
    foreach($row as $k=>$v) {
        if (in_array($k,['password_hash','deleted_at','deleted_by_app','deleted_by_user_id','deletion_reason'],true)) continue;
        $parts=explode('_',$k); $key=array_shift($parts); foreach($parts as $p)$key.=ucfirst($p);
        if ($v!==null && is_numeric($v) && preg_match('/(id|amount|total|quantity|price|percentage|rate|decimals)$/',$key)) $v=is_numeric($v) ? (strpos((string)$v,'.')!==false?(float)$v:(int)$v):$v;
        $out[$key]=$v;
    }
    return $out;
}
function generic_crud(string $method,string $table,string $resource,?int $id): never {
    $pdo=db();
    $soft=in_array($table,['brands','item_series','warehouses','services','business_documents','account_categories','cash_boxes','financial_entries','workplaces','user_groups','users','employees','drivers'],true);
    $updated=in_array($table,['warehouses','services','financial_entries','workplaces','user_groups','users','employees','drivers','module_settings','currencies','quota_ratios'],true);
    $allowed=['line_total','payment_type','brand_id','workplace_id','group_id','user_id','employee_id','account_id','cash_box_id','from_warehouse_id','to_warehouse_id','warehouse_id','item_id','reference_id','name','code','address','phone','email','currency','status','details','unit','price','description','permissions','username','display_name','password_hash','last_login_at','job_title','department','start_date','end_date','compensation','compensation_currency','vehicle','license_number','is_assigned','account_type','module','key','value','rate','decimals','symbol','percentage','side','debt_date','amount','note','entry_date','category','payment_method','due_date','attachment_url','direction','payment_date','reference_type','number','kind','document_date','valid_until','total','discount','tax','paid_amount','transfer_date','movement_date','type','quantity'];
    if($method==='GET' && $id===null) {
        $where = $soft ? ' WHERE deleted_at IS NULL' : ''; $params=[]; $first=$where===''?' WHERE ':' AND ';
        foreach($_GET as $k=>$v) { if($v===''||$k==='limit')continue; $col=generic_snake($k); if(in_array($col,$allowed,true)){$where.=$first."`$col`=:q_$col";$first=' AND ';$params["q_$col"]=$v;} }
        $sql="SELECT * FROM `$table`".$where." ORDER BY id DESC"; if(isset($_GET['limit']))$sql.=' LIMIT '.max(1,min(1000,(int)$_GET['limit']));
        $s=$pdo->prepare($sql);$s->execute($params);json_response(array_map('generic_table_row',$s->fetchAll()));
    }
    if($method==='GET' && $id!==null){$where=$soft?' AND deleted_at IS NULL':'';$s=$pdo->prepare("SELECT * FROM `$table` WHERE id=:id".$where);$s->execute(['id'=>$id]);$r=$s->fetch();if(!$r)error_response(ucfirst($resource).' not found.',404);$out=generic_table_row($r);if($table==='business_documents'){$q=$pdo->prepare('SELECT id,item_id,warehouse_id,description,quantity,unit_price,discount,tax,line_total FROM business_document_lines WHERE document_id=:id');$q->execute(['id'=>$id]);$out['lines']=array_map('generic_table_row',$q->fetchAll());$a=$pdo->prepare('SELECT name FROM accounts WHERE id=:id');$a->execute(['id'=>$r['account_id']]);$out['accountName']=(string)($a->fetchColumn()?:'');}if($table==='stock_transfers'){$q=$pdo->prepare('SELECT id,item_id,quantity FROM stock_transfer_lines WHERE transfer_id=:id');$q->execute(['id'=>$id]);$out['lines']=array_map('generic_table_row',$q->fetchAll());}json_response($out);}
    $body=json_body();
    if($method==='POST' && $id===null){
        $lines = $body['lines'] ?? [];
        $body = generic_prepare($body);
        if (!$body) error_response('Request body is required.', 400);
        try {
            $pdo->beginTransaction();
            $cols = array_keys($body);
            $sql = "INSERT INTO `$table` (`" . implode('`,`', $cols) . "`) VALUES (:" . implode(',:', $cols) . ")";
            $statement = $pdo->prepare($sql);
            $statement->execute($body);
            $new = (int)$pdo->lastInsertId();
            if ($table === 'business_documents' && is_array($lines)) {
                foreach ($lines as $line) {
                    $prepared = generic_prepare($line);
                    $prepared['document_id'] = $new;
                    $prepared['line_total'] = $prepared['line_total'] ?? 0;
                    $prepared['description'] = $prepared['description'] ?? '';
                    $prepared['discount'] = $prepared['discount'] ?? 0;
                    $prepared['tax'] = $prepared['tax'] ?? 0;
                    $lineColumns = array_keys($prepared);
                    $lineStatement = $pdo->prepare(
                        "INSERT INTO business_document_lines (`" . implode('`,`', $lineColumns) . "`) VALUES (:" . implode(',:', $lineColumns) . ")",
                    );
                    $lineStatement->execute($prepared);
                }
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('[rawand-cpanel] create error: ' . $error->getMessage());
            error_response('Could not save this record.', 500, 'write_failed');
        }
        $actor = auth_session_user();
        auth_audit('create', $actor ? (int)$actor['id'] : null, $resource, $new);
        generic_crud('GET', $table, $resource, $new);
    }
    if(in_array($method,['PATCH','DELETE'],true)&&$id!==null){
        if ($method === 'DELETE') {
            try {
                $pdo->beginTransaction();
                if ($soft) {
                    $statement = $pdo->prepare("UPDATE `$table` SET deleted_at=UTC_TIMESTAMP(3),status='inactive' WHERE id=:id AND deleted_at IS NULL");
                } else {
                    $statement = $pdo->prepare("DELETE FROM `$table` WHERE id=:id");
                }
                $statement->execute(['id' => $id]);
                if (!$statement->rowCount()) {
                    $pdo->rollBack();
                    error_response(ucfirst($resource) . ' not found.', 404);
                }
                $pdo->commit();
            } catch (Throwable $error) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                error_log('[rawand-cpanel] delete error: ' . $error->getMessage());
                error_response('Could not delete this record.', 500, 'delete_failed');
            }
            $actor = auth_session_user();
            auth_audit('delete', $actor ? (int)$actor['id'] : null, $resource, $id);
            http_response_code(204);
            exit;
        }
        $body = generic_prepare($body);
        if (!$body) error_response('At least one field is required.', 400);
        $sets = [];
        $params = ['id' => $id];
        foreach ($body as $key => $value) {
            $sets[] = "`$key`=:$key";
            $params[$key] = $value;
        }
        if ($updated) $sets[] = 'updated_at=UTC_TIMESTAMP(3)';
        $where = $soft ? ' AND deleted_at IS NULL' : '';
        try {
            $pdo->beginTransaction();
            $statement = $pdo->prepare("UPDATE `$table` SET " . implode(',', $sets) . " WHERE id=:id" . $where);
            $statement->execute($params);
            if (!$statement->rowCount()) {
                $pdo->rollBack();
                error_response(ucfirst($resource) . ' not found.', 404);
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('[rawand-cpanel] update error: ' . $error->getMessage());
            error_response('Could not update this record.', 500, 'write_failed');
        }
        $actor = auth_session_user();
        auth_audit('update', $actor ? (int)$actor['id'] : null, $resource, $id);
        generic_crud('GET', $table, $resource, $id);
    }
    error_response('Method not allowed.',405);
}
function generic_prepare(array $body): array {
    $allowed=['line_total','payment_type','brand_id','workplace_id','group_id','user_id','employee_id','account_id','cash_box_id','from_warehouse_id','to_warehouse_id','warehouse_id','item_id','reference_id','name','code','address','phone','email','currency','status','details','unit','price','description','permissions','username','display_name','password_hash','last_login_at','job_title','department','start_date','end_date','compensation','compensation_currency','vehicle','license_number','is_assigned','account_type','module','key','value','rate','decimals','symbol','percentage','side','debt_date','amount','note','entry_date','category','payment_method','due_date','attachment_url','direction','payment_date','reference_type','number','kind','document_date','valid_until','total','discount','tax','paid_amount','transfer_date','movement_date','type','quantity'];
    $out=[]; foreach($body as $k=>$v){$col=generic_snake($k);if(!in_array($col,$allowed,true))continue;if(is_array($v))$v=json_encode($v,JSON_UNESCAPED_UNICODE);$out[$col]=$v;} return $out;
}
function generic_snake(string $s): string { return strtolower((string)preg_replace('/(?<!^)[A-Z]/','_$0',$s)); }
function generic_restore(string $table, ?int $id): never {
    if (!$id || !in_array($table, ['accounts','items','transactions','invoices','brands','item_series','warehouses','services','business_documents','account_categories','financial_entries','employees','drivers'], true)) {
        error_response('Record not found.', 404);
    }
    $statement = db()->prepare("UPDATE `$table` SET deleted_at=NULL,status='active' WHERE id=:id");
    $statement->execute(['id' => $id]);
    if (!$statement->rowCount()) error_response('Deleted record not found.', 404);
    $actor = auth_session_user();
    auth_audit('restore', $actor ? (int)$actor['id'] : null, $table, $id);
    generic_crud('GET', $table, 'record', $id);
}
function generic_deleted(): never { $all=[]; foreach(['accounts','items','transactions','invoices','brands','item_series','warehouses','services','business_documents','financial_entries','employees','drivers'] as $t){try{$r=db()->query("SELECT id,deleted_at FROM `$t` WHERE deleted_at IS NOT NULL")->fetchAll();foreach($r as $x)$all[]=['resource'=>$t,'id'=>(int)$x['id'],'summary'=>$t.' #'.(int)$x['id'],'reference'=>null,'recordDate'=>null,'deletedAt'=>iso_timestamp($x['deleted_at'])];}catch(Throwable){} } json_response($all); }
function generic_report(string $path): never {
    $pdo=db();
    if(str_ends_with($path,'inventory-balance')) {
        $sql='SELECT warehouse_id,item_id,quantity,reorder_level,(quantity <= reorder_level) AS is_low_stock FROM warehouse_stock WHERE 1=1';$p=[];
        if(isset($_GET['warehouseId'])){$sql.=' AND warehouse_id=:w';$p['w']=(int)$_GET['warehouseId'];}if(isset($_GET['itemId'])){$sql.=' AND item_id=:i';$p['i']=(int)$_GET['itemId'];}$s=$pdo->prepare($sql);$s->execute($p);json_response(array_map('generic_table_row',$s->fetchAll()));
    }
    if(str_ends_with($path,'cashbox-transactions')) {
        $rows=[];$s=$pdo->query("SELECT id,entry_date AS date,amount,currency,description,status,payment_method AS direction FROM financial_entries WHERE deleted_at IS NULL");foreach($s->fetchAll() as $r){$r['source']='financial_entry';$rows[]=generic_table_row($r);}
        $s=$pdo->query("SELECT id,payment_date AS date,amount,currency,note AS description,status,direction FROM payments WHERE deleted_at IS NULL");foreach($s->fetchAll() as $r){$r['source']='payment';$rows[]=generic_table_row($r);}json_response($rows);
    }
    if(str_ends_with($path,'profit-loss')){$s=$pdo->query("SELECT type,COALESCE(SUM(amount),0) amount,currency FROM transactions WHERE deleted_at IS NULL GROUP BY type,currency");$in=0.;$ex=0.;$currency='IQD';foreach($s->fetchAll() as $r){$currency=$r['currency'];if($r['type']==='income')$in+=(float)$r['amount'];else$ex+=(float)$r['amount'];}json_response(['income'=>row_number($in),'expense'=>row_number($ex),'profit'=>row_number($in-$ex),'currency'=>$currency]);}
    if(str_ends_with($path,'debt')){$r=$pdo->query("SELECT id AS account_id,name AS account_name,type AS account_type,balance,currency FROM accounts WHERE deleted_at IS NULL ORDER BY name")->fetchAll();json_response(array_map('generic_table_row',$r));}
    error_response('Unknown report.',404);
}
function generic_login(): never { auth_login(); }
function generic_password(): never {
    $user = auth_require();
    $body = json_body();
    $old = required_string($body, 'currentPassword');
    $new = required_string($body, 'newPassword');
    if (strlen($new) < 8) error_response('The new password must be at least 8 characters.', 400);
    $statement = db()->prepare('SELECT password_hash FROM users WHERE id=:id');
    $statement->execute(['id' => $user['id']]);
    $row = $statement->fetch();
    if (!$row || !password_verify($old, (string)$row['password_hash'])) {
        error_response('Current password is incorrect.', 400);
    }
    $update = db()->prepare('UPDATE users SET password_hash=:password_hash, updated_at=UTC_TIMESTAMP(3) WHERE id=:id');
    $update->execute(['password_hash' => password_hash($new, PASSWORD_DEFAULT), 'id' => $user['id']]);
    auth_audit('password_changed', (int)$user['id'], 'users', (int)$user['id']);
    auth_logout();
}

function generic_bootstrap(): never {
    $body = json_body();
    $token = required_string($body, 'bootstrapToken');
    $configuredToken = trim((string)app_config('app.bootstrap_token', ''));
    if ($configuredToken === '' || !hash_equals($configuredToken, $token)) {
        error_response('Bootstrap is not available.', 404, 'bootstrap_unavailable');
    }
    if ((int)db()->query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL')->fetchColumn() > 0) {
        error_response('The first administrator already exists.', 409, 'bootstrap_complete');
    }
    $username = required_string($body, 'username');
    $displayName = required_string($body, 'displayName');
    $password = required_string($body, 'password');
    if (strlen($password) < 8) error_response('The password must be at least 8 characters.', 400);
    $statement = db()->prepare(
        'INSERT INTO users (username, display_name, password_hash, status)
         VALUES (:username, :display_name, :password_hash, "active")',
    );
    $statement->execute([
        'username' => $username,
        'display_name' => $displayName,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
    $id = (int)db()->lastInsertId();
    auth_audit('bootstrap_admin_created', $id, 'users', $id);
    json_response(['id' => $id, 'username' => $username, 'displayName' => $displayName, 'status' => 'active'], 201);
}