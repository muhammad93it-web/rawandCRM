<?php
declare(strict_types=1);

/* Generic handlers for the catalog, organization and accounting resources.
 * Keeping these in one small adapter makes the cPanel build easy to extend
 * while all writes still use PDO prepared statements and soft deletion. */
function generic_dispatch(string $method, string $path): bool
{
    $map = [
        'brands'=>'brands','series'=>'series','warehouses'=>'warehouses','services'=>'services',
        'business-documents'=>'business_documents','account-categories'=>'account_categories',
        'cash-boxes'=>'cash_boxes','opening-debts'=>'opening_debts','payments'=>'payments',
        'financial-entries'=>'financial_entries','currencies'=>'currencies','quota-ratios'=>'quota_ratios',
        'settings'=>'module_settings','workplaces'=>'workplaces','groups'=>'user_groups',
        'users'=>'users','employees'=>'employees','drivers'=>'drivers','stock-transfers'=>'stock_transfers',
        'stock-movements'=>'stock_movements',
    ];
    if ($path === '/session/login' && $method === 'POST') { generic_login(); return true; }
    if ($path === '/session/logout' && $method === 'POST') { $_SESSION=[]; session_destroy(); json_response(['ok'=>true]); }
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
    if($method==='GET' && $id===null) {
        $where = in_array($table,['currencies','quota_ratios','opening_debts','stock_transfers','stock_movements'],true) ? '' : ' WHERE deleted_at IS NULL'; $params=[];
        foreach($_GET as $k=>$v) { if($v===''||$k==='limit')continue; $col=generic_snake($k); if(preg_match('/^[a-z_]+$/',$col)){$where.=" AND `$col`=:q_$col";$params["q_$col"]=$v;} }
        $sql="SELECT * FROM `$table`".$where." ORDER BY id DESC"; if(isset($_GET['limit']))$sql.=' LIMIT '.max(1,min(1000,(int)$_GET['limit']));
        $s=$pdo->prepare($sql);$s->execute($params);json_response(array_map('generic_table_row',$s->fetchAll()));
    }
    if($method==='GET' && $id!==null){$where=in_array($table,['currencies','quota_ratios','opening_debts','stock_transfers','stock_movements'],true)?'':' AND deleted_at IS NULL';$s=$pdo->prepare("SELECT * FROM `$table` WHERE id=:id".$where);$s->execute(['id'=>$id]);$r=$s->fetch();if(!$r)error_response(ucfirst($resource).' not found.',404);json_response(generic_table_row($r));}
    $body=json_body();
    if($method==='POST' && $id===null){
        $body=generic_prepare($body); if(!$body)error_response('Request body is required.',400);
        $cols=array_keys($body);$sql="INSERT INTO `$table` (`".implode('`,`',$cols)."`) VALUES (:".implode(',:',$cols).")";$s=$pdo->prepare($sql);$s->execute($body);$new=(int)$pdo->lastInsertId();generic_crud('GET',$table,$resource,$new);
    }
    if(in_array($method,['PATCH','DELETE'],true)&&$id!==null){
        if($method==='DELETE'){ $s=$pdo->prepare("UPDATE `$table` SET deleted_at=UTC_TIMESTAMP(3) WHERE id=:id");$s->execute(['id'=>$id]);if(!$s->rowCount())error_response(ucfirst($resource).' not found.',404);http_response_code(204);exit; }
        $body=generic_prepare($body);if(!$body)error_response('At least one field is required.',400);$sets=[];$params=['id'=>$id];foreach($body as $k=>$v){$sets[]="`$k`=:$k";$params[$k]=$v;}$sets[]='updated_at=UTC_TIMESTAMP(3)';$s=$pdo->prepare("UPDATE `$table` SET ".implode(',',$sets)." WHERE id=:id AND deleted_at IS NULL");$s->execute($params);generic_crud('GET',$table,$resource,$id);
    }
    error_response('Method not allowed.',405);
}
function generic_prepare(array $body): array {
    $out=[]; foreach($body as $k=>$v){$col=generic_snake($k);if(!preg_match('/^[a-z][a-z0-9_]*$/',$col)||in_array($col,['id','created_at','updated_at','deleted_at'],true))continue;if(is_array($v))$v=json_encode($v,JSON_UNESCAPED_UNICODE);$out[$col]=$v;} return $out;
}
function generic_snake(string $s): string { return strtolower((string)preg_replace('/(?<!^)[A-Z]/','_$0',$s)); }
function generic_restore(string $table,?int $id): never {if(!$id)error_response('Record not found.',404);$s=db()->prepare("UPDATE `$table` SET deleted_at=NULL WHERE id=:id");$s->execute(['id'=>$id]);if(!$s->rowCount())error_response('Deleted record not found.',404);generic_crud('GET',$table,'record',$id);}
function generic_deleted(): never { $all=[]; foreach(['accounts','items','transactions','invoices','brands','series','warehouses','services','business_documents','financial_entries','employees','drivers'] as $t){try{$r=db()->query("SELECT id,deleted_at FROM `$t` WHERE deleted_at IS NOT NULL")->fetchAll();foreach($r as $x)$all[]=['resource'=>$t,'id'=>(int)$x['id'],'deletedAt'=>iso_timestamp($x['deleted_at'])];}catch(Throwable){} } json_response($all); }
function generic_report(string $path): never { $pdo=db(); if(str_ends_with($path,'inventory-balance')){$r=$pdo->query("SELECT id,name,quantity,reorder_level FROM items WHERE deleted_at IS NULL ORDER BY name")->fetchAll();json_response(array_map('generic_table_row',$r));} if(str_ends_with($path,'debt')){$r=$pdo->query("SELECT id,name,type,balance,currency FROM accounts WHERE deleted_at IS NULL ORDER BY name")->fetchAll();json_response(array_map('generic_table_row',$r));} json_response([]); }
function generic_login(): never { $b=json_body();$u=required_string($b,'username');$p=required_string($b,'password');$s=db()->prepare('SELECT * FROM users WHERE username=:u AND deleted_at IS NULL AND status="active"');$s->execute(['u'=>$u]);$r=$s->fetch();if(!$r||!password_verify($p,(string)$r['password_hash']))error_response('Invalid username or password.',401);$_SESSION['user_id']=(int)$r['id'];$s=db()->prepare('UPDATE users SET last_login_at=UTC_TIMESTAMP(3) WHERE id=:id');$s->execute(['id'=>$r['id']]);json_response(['user'=>generic_table_row($r)]); }
function generic_password(): never {if(empty($_SESSION['user_id']))error_response('Authentication required.',401);$b=json_body();$old=required_string($b,'currentPassword');$new=required_string($b,'newPassword');$s=db()->prepare('SELECT password_hash FROM users WHERE id=:id');$s->execute(['id'=>$_SESSION['user_id']]);$r=$s->fetch();if(!$r||!password_verify($old,$r['password_hash']))error_response('Current password is incorrect.',400);$s=db()->prepare('UPDATE users SET password_hash=:p WHERE id=:id');$s->execute(['p'=>password_hash($new,PASSWORD_DEFAULT),'id'=>$_SESSION['user_id']]);json_response(['ok'=>true]);}