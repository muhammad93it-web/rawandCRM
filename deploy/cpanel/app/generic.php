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
    if (str_starts_with($path,'/reports/')) {
        if ($method !== 'GET') error_response('Method not allowed.',405);
        generic_report($path);
        return true;
    }
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
function generic_report_id(string $key): ?int {
    $value=$_GET[$key]??null;
    if($value===null||$value==='')return null;
    if(filter_var($value,FILTER_VALIDATE_INT)===false||(int)$value<1)error_response("The {$key} field must be a positive integer.",400);
    return (int)$value;
}
function generic_report_date(string $key): ?string {
    $value=$_GET[$key]??null;
    if($value===null||$value==='')return null;
    if(!is_string($value)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$value))error_response("The {$key} field must be a valid date.",400);
    [$year,$month,$day]=array_map('intval',explode('-',$value));
    if(!checkdate($month,$day,$year))error_response("The {$key} field must be a valid date.",400);
    return $value;
}
function generic_report_period(): array {
    $from=generic_report_date('from');$to=generic_report_date('to');
    if($from!==null&&$to!==null&&$from>$to)error_response('The from date must not be after the to date.',400);
    return [$from,$to];
}
function generic_report_row(array $row): array {
    $out=generic_table_row($row);
    foreach($out as $key=>$value){
        if($value!==null&&is_numeric($value)&&preg_match('/(?:Id|Count|amount|total|quantity|price|balance|level|discount|tax|income|expense|profit|overdue|value|activity)$/i',$key)){
            $out[$key]=row_number($value);
        }
        if($value!==null&&is_string($value)&&str_ends_with($key,'At'))$out[$key]=iso_timestamp($value);
    }
    if(array_key_exists('isLowStock',$out))$out['isLowStock']=(bool)$out['isLowStock'];
    return $out;
}
function generic_report_rows(PDO $pdo,string $sql,array $params=[]): array {
    $statement=$pdo->prepare($sql);$statement->execute($params);
    return array_map('generic_report_row',$statement->fetchAll());
}
function generic_report_has_column(PDO $pdo,string $table,string $column): bool {
    static $known=[];
    $key=$table.'.'.$column;
    if(!array_key_exists($key,$known)){
        $statement=$pdo->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:table_name AND column_name=:column_name');
        $statement->execute(['table_name'=>$table,'column_name'=>$column]);
        $known[$key]=(int)$statement->fetchColumn()>0;
    }
    return $known[$key];
}
function generic_report_invoice_lines(PDO $pdo,array $invoices): array {
    if(!$invoices)return $invoices;
    $hasWarehouse=generic_report_has_column($pdo,'invoice_lines','warehouse_id');
    $params=[];$placeholders=[];
    foreach($invoices as $index=>$invoice){$key="invoice_$index";$placeholders[]=":$key";$params[$key]=(int)$invoice['id'];}
    $statement=$pdo->prepare('SELECT il.id,il.invoice_id,il.item_id,COALESCE(i.name,\'\') AS item_name,
        COALESCE(i.barcode,\'\') AS barcode,COALESCE(i.unit,\'\') AS unit,'.($hasWarehouse?'il.warehouse_id':'NULL AS warehouse_id').',
        il.quantity,il.unit_price,il.discount,il.line_total
        FROM invoice_lines il LEFT JOIN items i ON i.id=il.item_id
        WHERE il.deleted_at IS NULL AND il.invoice_id IN ('.implode(',',$placeholders).') ORDER BY il.invoice_id,il.id');
    $statement->execute($params);$lines=[];
    foreach($statement->fetchAll() as $line){
        $line=generic_report_row($line);$invoiceId=(int)$line['invoiceId'];unset($line['invoiceId']);
        $lines[$invoiceId][]=$line;
    }
    foreach($invoices as &$invoice){$invoice['lines']=$lines[(int)$invoice['id']]??[];$invoice['itemsCount']=count($invoice['lines']);}
    unset($invoice);
    return $invoices;
}
function generic_report(string $path): never {
    $pdo=db();$report=substr($path,strlen('/reports/'));

    if(in_array($report,['inventory-balance','stock'],true)){
        $warehouseId=generic_report_id('warehouseId');$itemId=generic_report_id('itemId');$params=[];
        $stock=$report==='stock';
        $sql='SELECT ws.warehouse_id'.($stock?',w.name AS warehouse_name':'').',ws.item_id'.($stock?',i.name AS item_name,i.barcode':'').',
                     ws.quantity,ws.reorder_level'.($stock?',i.unit,i.purchase_price,(ws.quantity*i.purchase_price) AS stock_value':'').',
                     (ws.quantity <= ws.reorder_level) AS is_low_stock
              FROM warehouse_stock ws
              INNER JOIN warehouses w ON w.id=ws.warehouse_id AND w.deleted_at IS NULL
              INNER JOIN items i ON i.id=ws.item_id AND i.deleted_at IS NULL
              WHERE 1=1';
        if($warehouseId!==null){$sql.=' AND ws.warehouse_id=:warehouse_id';$params['warehouse_id']=$warehouseId;}
        if($itemId!==null){$sql.=' AND ws.item_id=:item_id';$params['item_id']=$itemId;}
        if($stock&&isset($_GET['lowStock'])&&$_GET['lowStock']!==''){
            $low=filter_var($_GET['lowStock'],FILTER_VALIDATE_BOOLEAN,FILTER_NULL_ON_FAILURE);
            if($low===null)error_response('The lowStock field must be a boolean.',400);
            $sql.=' AND (ws.quantity <= ws.reorder_level)=:low_stock';$params['low_stock']=$low?1:0;
        }
        $sql.=$stock?' ORDER BY w.name,i.name':' ORDER BY ws.warehouse_id,ws.item_id';
        json_response(generic_report_rows($pdo,$sql,$params));
    }

    if(in_array($report,['cashbox-transactions','cashbox'],true)){
        $cashBoxId=generic_report_id('cashBoxId');$workplaceId=generic_report_id('workplaceId');[$from,$to]=generic_report_period();$params=[];
        $financialWhere=['fe.deleted_at IS NULL',"fe.status<>'cancelled'",'fe.cash_box_id IS NOT NULL'];$paymentWhere=['p.deleted_at IS NULL',"p.status<>'cancelled'",'p.cash_box_id IS NOT NULL'];
        if($cashBoxId!==null){$financialWhere[]='fe.cash_box_id=:financial_cash_box_id';$paymentWhere[]='p.cash_box_id=:payment_cash_box_id';$params['financial_cash_box_id']=$cashBoxId;$params['payment_cash_box_id']=$cashBoxId;}
        if($workplaceId!==null){$financialWhere[]='fe.workplace_id=:financial_workplace_id';$paymentWhere[]='p.workplace_id=:payment_workplace_id';$params['financial_workplace_id']=$workplaceId;$params['payment_workplace_id']=$workplaceId;}
        if(isset($_GET['currency'])&&$_GET['currency']!==''){$financialWhere[]='fe.currency=:financial_currency';$paymentWhere[]='p.currency=:payment_currency';$params['financial_currency']=(string)$_GET['currency'];$params['payment_currency']=(string)$_GET['currency'];}
        if($from!==null){$financialWhere[]='fe.entry_date>=:financial_from';$paymentWhere[]='p.payment_date>=:payment_from';$params['financial_from']=$from;$params['payment_from']=$from;}
        if($to!==null){$financialWhere[]='fe.entry_date<=:financial_to';$paymentWhere[]='p.payment_date<=:payment_to';$params['financial_to']=$to;$params['payment_to']=$to;}
        $sql="SELECT id,source,date,workplace_id,cash_box_id,amount,currency,description,direction,status FROM (
                SELECT fe.id,'financial_entry' AS source,fe.entry_date AS date,fe.workplace_id,fe.cash_box_id,fe.amount,fe.currency,
                       COALESCE(NULLIF(fe.description,''),fe.category) AS description,
                       CASE WHEN fe.type='income' THEN 'received' WHEN fe.type='expense' THEN 'paid' ELSE NULL END AS direction,
                       fe.status
                FROM financial_entries fe WHERE ".implode(' AND ',$financialWhere)."
                UNION ALL
                SELECT p.id,'payment' AS source,p.payment_date AS date,p.workplace_id,p.cash_box_id,p.amount,p.currency,p.note AS description,p.direction,p.status
                FROM payments p WHERE ".implode(' AND ',$paymentWhere)."
              ) report_rows ORDER BY date DESC,id DESC";
        json_response(generic_report_rows($pdo,$sql,$params));
    }

    if(in_array($report,['sales','purchases'],true)){
        $type=$report==='sales'?'sale':'purchase';$accountId=generic_report_id('accountId');$workplaceId=generic_report_id('workplaceId');$warehouseId=generic_report_id('warehouseId');[$from,$to]=generic_report_period();
        $hasWorkplace=generic_report_has_column($pdo,'invoices','workplace_id');$hasWarehouse=generic_report_has_column($pdo,'invoices','warehouse_id');
        $hasCreator=generic_report_has_column($pdo,'invoices','created_by_user_id')&&generic_report_has_column($pdo,'users','display_name');
        $hasEmployee=$hasCreator&&generic_report_has_column($pdo,'employees','user_id')&&generic_report_has_column($pdo,'employees','name');
        $where=['iv.deleted_at IS NULL','iv.type=:invoice_type','a.deleted_at IS NULL'];$params=['invoice_type'=>$type];
        if($accountId!==null){$where[]='iv.account_id=:account_id';$params['account_id']=$accountId;}
        if($workplaceId!==null){$where[]=$hasWorkplace?'iv.workplace_id=:workplace_id':'1=0';if($hasWorkplace)$params['workplace_id']=$workplaceId;}
        if($warehouseId!==null){$where[]=$hasWarehouse?'iv.warehouse_id=:warehouse_id':'1=0';if($hasWarehouse)$params['warehouse_id']=$warehouseId;}
        if($from!==null){$where[]='iv.date>=:date_from';$params['date_from']=$from;}
        if($to!==null){$where[]='iv.date<=:date_to';$params['date_to']=$to;}
        foreach(['status'=>'iv.status','currency'=>'iv.currency'] as $query=>$column)if(isset($_GET[$query])&&$_GET[$query]!==''){$where[]="$column=:$query";$params[$query]=(string)$_GET[$query];}
        $sql="SELECT iv.id,iv.number,iv.date,iv.account_id,a.name AS account_name,".($hasWorkplace?'iv.workplace_id':'NULL AS workplace_id').','.($hasWarehouse?'iv.warehouse_id':'NULL AS warehouse_id').','.
                     ($hasCreator?'iv.created_by_user_id,cu.display_name AS created_by_user_name':'NULL AS created_by_user_id,NULL AS created_by_user_name').','.
                     ($hasEmployee?'e.id AS employee_id,e.name AS employee_name':'NULL AS employee_id,NULL AS employee_name').",
                     iv.total,iv.paid_amount,GREATEST(0,iv.total-iv.paid_amount) AS outstanding_amount,
                     iv.currency,iv.payment_type,iv.status
              FROM invoices iv INNER JOIN accounts a ON a.id=iv.account_id".
              ($hasCreator?' LEFT JOIN users cu ON cu.id=iv.created_by_user_id AND cu.deleted_at IS NULL':'').
              ($hasEmployee?' LEFT JOIN employees e ON e.id=(SELECT MIN(employee.id) FROM employees employee WHERE employee.user_id=cu.id AND employee.deleted_at IS NULL)':'')."
              WHERE ".implode(' AND ',$where).' ORDER BY iv.date DESC,iv.id DESC';
        json_response(generic_report_invoice_lines($pdo,generic_report_rows($pdo,$sql,$params)));
    }

    if($report==='accounts'){
        $where=['deleted_at IS NULL'];$params=[];
        if(isset($_GET['search'])&&$_GET['search']!==''){$where[]='name LIKE :search';$params['search']='%'.(string)$_GET['search'].'%';}
        if(isset($_GET['type'])&&$_GET['type']!==''){$where[]='type=:account_type';$params['account_type']=(string)$_GET['type'];}
        if(isset($_GET['status'])&&$_GET['status']!==''){$where[]='status=:status';$params['status']=(string)$_GET['status'];}
        if(isset($_GET['currency'])&&$_GET['currency']!==''){$where[]='currency=:currency';$params['currency']=(string)$_GET['currency'];}
        json_response(generic_report_rows($pdo,'SELECT id AS account_id,name,type,phone,city,balance,currency,status FROM accounts WHERE '.implode(' AND ',$where).' ORDER BY name,id',$params));
    }

    if(in_array($report,['debt','debts'],true)){
        $accountId=generic_report_id('accountId');$where=['deleted_at IS NULL','balance<>0'];$params=[];
        if($accountId!==null){$where[]='id=:account_id';$params['account_id']=$accountId;}
        if(isset($_GET['accountType'])&&$_GET['accountType']!==''){$where[]='type=:account_type';$params['account_type']=(string)$_GET['accountType'];}
        if(isset($_GET['currency'])&&$_GET['currency']!==''){$where[]='currency=:currency';$params['currency']=(string)$_GET['currency'];}
        json_response(generic_report_rows($pdo,'SELECT id AS account_id,name AS account_name,type AS account_type,balance,currency FROM accounts WHERE '.implode(' AND ',$where).' ORDER BY name,id',$params));
    }

    if($report==='overdue-debts'){
        $asOf=generic_report_date('asOf')??(new DateTimeImmutable('today'))->format('Y-m-d');
        $accountId=generic_report_id('accountId');$workplaceId=generic_report_id('workplaceId');
        $where=['fe.deleted_at IS NULL',"fe.type='debt'","fe.status NOT IN ('settled','cancelled')",'fe.due_date IS NOT NULL','fe.due_date<:as_of','a.deleted_at IS NULL'];
        $params=['as_of'=>$asOf];
        if($accountId!==null){$where[]='fe.account_id=:account_id';$params['account_id']=$accountId;}
        if($workplaceId!==null){$where[]='fe.workplace_id=:workplace_id';$params['workplace_id']=$workplaceId;}
        if(isset($_GET['currency'])&&$_GET['currency']!==''){$where[]='fe.currency=:currency';$params['currency']=(string)$_GET['currency'];}
        $sql='SELECT fe.id,fe.workplace_id,fe.account_id,a.name AS account_name,fe.entry_date,fe.due_date,
                     fe.category,fe.description,fe.amount,fe.currency,fe.status,DATEDIFF(:days_overdue_as_of,fe.due_date) AS days_overdue
              FROM financial_entries fe INNER JOIN accounts a ON a.id=fe.account_id
              WHERE '.implode(' AND ',$where).' ORDER BY fe.due_date,fe.id';
        $params['days_overdue_as_of']=$asOf;
        json_response(generic_report_rows($pdo,$sql,$params));
    }

    if($report==='account-last-activity'){
        $accountId=generic_report_id('accountId');$workplaceId=generic_report_id('workplaceId');$asOf=generic_report_date('asOf')??(new DateTimeImmutable('today'))->format('Y-m-d');
        $dayFilter=function(string $key): ?int {
            $value=$_GET[$key]??null;
            if($value===null||$value==='')return null;
            if(!is_scalar($value)||!preg_match('/^\d+$/',(string)$value))error_response("The {$key} field must be a non-negative integer.",400);
            return (int)$value;
        };
        $minDays=$dayFilter('minDays');$maxDays=$dayFilter('maxDays');
        if($minDays!==null&&$maxDays!==null&&$minDays>$maxDays)error_response('The minDays field must not be greater than maxDays.',400);
        $where=['a.deleted_at IS NULL',"a.type='customer'"];$latestWhere=['latest.account_id=a.id','latest.deleted_at IS NULL',"latest.type='sale'",'latest.date<=:latest_as_of'];$params=['latest_as_of'=>$asOf,'days_as_of'=>$asOf];
        if($accountId!==null){$where[]='a.id=:account_id';$params['account_id']=$accountId;}
        if(isset($_GET['search'])&&$_GET['search']!==''){$pattern='%'.(string)$_GET['search'].'%';$where[]='(a.name LIKE :search_name OR a.phone LIKE :search_phone OR a.city LIKE :search_city)';$params['search_name']=$pattern;$params['search_phone']=$pattern;$params['search_city']=$pattern;}
        if($workplaceId!==null){if(generic_report_has_column($pdo,'invoices','workplace_id')){$latestWhere[]='latest.workplace_id=:workplace_id';$params['workplace_id']=$workplaceId;}else $latestWhere[]='1=0';}
        if(isset($_GET['currency'])&&$_GET['currency']!==''){$latestWhere[]='latest.currency=:invoice_currency';$params['invoice_currency']=(string)$_GET['currency'];}
        if($minDays!==null){$where[]='DATEDIFF(:min_days_as_of,iv.date)>=:min_days';$params['min_days_as_of']=$asOf;$params['min_days']=$minDays;}
        if($maxDays!==null){$where[]='DATEDIFF(:max_days_as_of,iv.date)<=:max_days';$params['max_days_as_of']=$asOf;$params['max_days']=$maxDays;}
        $sql='SELECT a.id AS account_id,a.name AS account_name,a.city,a.phone,
                     iv.created_at AS latest_activity_at,iv.date AS latest_activity_date,
                     GREATEST(0,DATEDIFF(:days_as_of,iv.date)) AS days_since_activity,
                     iv.number AS latest_invoice_number,iv.total AS latest_invoice_total,iv.currency AS latest_invoice_currency
              FROM accounts a
              INNER JOIN invoices iv ON iv.id=(
                  SELECT latest.id FROM invoices latest
                  WHERE '.implode(' AND ',$latestWhere).'
                  ORDER BY latest.date DESC,latest.created_at DESC,latest.id DESC LIMIT 1
              )
              WHERE '.implode(' AND ',$where).' ORDER BY a.name,a.id';
        json_response(generic_report_rows($pdo,$sql,$params));
    }

    if($report==='expenses'){
        $accountId=generic_report_id('accountId');$workplaceId=generic_report_id('workplaceId');[$from,$to]=generic_report_period();
        $where=["fe.deleted_at IS NULL","fe.type='expense'","fe.status<>'cancelled'"];$legacy=["deleted_at IS NULL","type='expense'","status<>'cancelled'"];$params=[];$legacyParams=[];
        if($accountId!==null){$where[]='fe.account_id=:account_id';$params['account_id']=$accountId;}
        if($workplaceId!==null){$where[]='fe.workplace_id=:workplace_id';$params['workplace_id']=$workplaceId;}
        if($from!==null){$where[]='fe.entry_date>=:date_from';$params['date_from']=$from;$legacy[]='date>=:legacy_from';$legacyParams['legacy_from']=$from;}
        if($to!==null){$where[]='fe.entry_date<=:date_to';$params['date_to']=$to;$legacy[]='date<=:legacy_to';$legacyParams['legacy_to']=$to;}
        foreach(['currency','category'] as $filter)if(isset($_GET[$filter])&&$_GET[$filter]!==''){$where[]="fe.$filter=:$filter";$params[$filter]=(string)$_GET[$filter];$legacy[]="$filter=:legacy_$filter";$legacyParams["legacy_$filter"]=(string)$_GET[$filter];}
        $legacySql=$accountId!==null||$workplaceId!==null?"SELECT NULL AS id,NULL AS source,NULL AS date,NULL AS workplace_id,NULL AS account_id,NULL AS account_name,NULL AS cash_box_id,NULL AS category,NULL AS description,NULL AS amount,NULL AS currency,NULL AS status WHERE 0":
          "SELECT id,'transaction' AS source,date,NULL AS workplace_id,NULL AS account_id,NULLIF(account_name,'') AS account_name,NULL AS cash_box_id,category,description,amount,currency,status FROM transactions WHERE ".implode(' AND ',$legacy);
        $sql="SELECT id,source,date,workplace_id,account_id,account_name,cash_box_id,category,description,amount,currency,status FROM (
                SELECT fe.id,'financial_entry' AS source,fe.entry_date AS date,fe.workplace_id,fe.account_id,a.name AS account_name,fe.cash_box_id,fe.category,fe.description,fe.amount,fe.currency,fe.status
                FROM financial_entries fe LEFT JOIN accounts a ON a.id=fe.account_id AND a.deleted_at IS NULL WHERE ".implode(' AND ',$where)."
                UNION ALL {$legacySql}
              ) expense_rows ORDER BY date DESC,id DESC";
        if($accountId!==null||$workplaceId!==null)$legacyParams=[];
        $params=array_merge($params,$legacyParams);
        json_response(generic_report_rows($pdo,$sql,$params));
    }

    if(in_array($report,['profit-loss','profit'],true)){
        [$from,$to]=generic_report_period();$workplaceId=generic_report_id('workplaceId');$currency=isset($_GET['currency'])&&$_GET['currency']!==''?(string)$_GET['currency']:null;
        $entryWhere=['deleted_at IS NULL',"status<>'cancelled'"];$invoiceWhere=['deleted_at IS NULL',"status='completed'"];$legacyWhere=['deleted_at IS NULL',"status<>'cancelled'"];$params=[];
        if($workplaceId!==null){$entryWhere[]='workplace_id=:entry_workplace';$params['entry_workplace']=$workplaceId;if(generic_report_has_column($pdo,'invoices','workplace_id')){$invoiceWhere[]='workplace_id=:invoice_workplace';$params['invoice_workplace']=$workplaceId;}else $invoiceWhere[]='1=0';}
        if($currency!==null){$entryWhere[]='currency=:entry_currency';$invoiceWhere[]='currency=:invoice_currency';$legacyWhere[]='currency=:legacy_currency';$params['entry_currency']=$currency;$params['invoice_currency']=$currency;$params['legacy_currency']=$currency;}
        if($from!==null){$entryWhere[]='entry_date>=:entry_from';$invoiceWhere[]='date>=:invoice_from';$legacyWhere[]='date>=:legacy_from';$params['entry_from']=$from;$params['invoice_from']=$from;$params['legacy_from']=$from;}
        if($to!==null){$entryWhere[]='entry_date<=:entry_to';$invoiceWhere[]='date<=:invoice_to';$legacyWhere[]='date<=:legacy_to';$params['entry_to']=$to;$params['invoice_to']=$to;$params['legacy_to']=$to;}
        $parts=[
            "SELECT currency,CASE WHEN type='income' THEN amount ELSE 0 END AS income,CASE WHEN type='expense' THEN amount ELSE 0 END AS expense FROM financial_entries WHERE ".implode(' AND ',$entryWhere)." AND type IN ('income','expense')",
            "SELECT currency,CASE WHEN type='sale' THEN total ELSE 0 END AS income,CASE WHEN type='purchase' THEN total ELSE 0 END AS expense FROM invoices WHERE ".implode(' AND ',$invoiceWhere)." AND type IN ('sale','purchase')",
        ];
        if($workplaceId===null)$parts[]="SELECT currency,CASE WHEN type='income' THEN amount ELSE 0 END AS income,CASE WHEN type='expense' THEN amount ELSE 0 END AS expense FROM transactions WHERE ".implode(' AND ',$legacyWhere)." AND type IN ('income','expense')";
        else foreach(array_keys($params) as $key)if(str_starts_with($key,'legacy_'))unset($params[$key]);
        $sql='SELECT currency,SUM(income) AS income,SUM(expense) AS expense,SUM(income)-SUM(expense) AS profit FROM ('.implode(' UNION ALL ',$parts).') profit_rows GROUP BY currency ORDER BY currency';
        $rows=generic_report_rows($pdo,$sql,$params);
        if($report==='profit')json_response($rows);
        json_response($rows[0]??['income'=>0,'expense'=>0,'profit'=>0,'currency'=>'IQD']);
    }
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