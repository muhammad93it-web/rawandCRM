<?php
declare(strict_types=1);

function shell_dispatch(string $method, string $path): bool
{
    $user = auth_require();
    $pdo = db();
    if ($path === '/currency-rates' && $method === 'GET') {
        $sql = "SELECT r.id,r.currency_id AS currencyId,c.name AS currencyName,c.code AS currencyCode,
                r.rate,r.rate_date AS rateDate,r.recorded_by_user_id AS recordedByUserId,
                u.display_name AS recordedByName,r.created_at AS createdAt
                FROM currency_rates r JOIN currencies c ON c.id=r.currency_id JOIN users u ON u.id=r.recorded_by_user_id";
        $params = [];
        if (isset($_GET['currencyId']) && $_GET['currencyId'] !== '') {
            $sql .= " WHERE r.currency_id=:currencyId"; $params['currencyId'] = (int)$_GET['currencyId'];
        }
        $sql .= " ORDER BY r.created_at DESC,r.id DESC";
        $statement=$pdo->prepare($sql);$statement->execute($params);
        $rows=$statement->fetchAll();
        foreach($rows as &$row){$row['id']=(int)$row['id'];$row['currencyId']=(int)$row['currencyId'];$row['rate']=(float)$row['rate'];$row['recordedByUserId']=(int)$row['recordedByUserId'];}
        json_response($rows);
    }
    if ($path === '/currency-rates/latest' && $method === 'GET') {
        $statement=$pdo->prepare("SELECT r.id,r.currency_id AS currencyId,c.name AS currencyName,c.code AS currencyCode,r.rate,r.rate_date AS rateDate,r.recorded_by_user_id AS recordedByUserId,u.display_name AS recordedByName,r.created_at AS createdAt FROM currency_rates r JOIN currencies c ON c.id=r.currency_id JOIN users u ON u.id=r.recorded_by_user_id WHERE UPPER(c.code)='USD' OR LOWER(c.name)='dolar' ORDER BY r.created_at DESC,r.id DESC LIMIT 1");
        $statement->execute();$row=$statement->fetch();
        if(!$row)error_response('No USD rate recorded',404,'not_found');
        $row['id']=(int)$row['id'];$row['currencyId']=(int)$row['currencyId'];$row['rate']=(float)$row['rate'];$row['recordedByUserId']=(int)$row['recordedByUserId'];json_response($row);
    }
    if ($path === '/currency-rates' && $method === 'POST') {
        $body=json_body();$currencyId=(int)($body['currencyId']??0);$rate=(float)($body['rate']??0);$rateDate=(string)($body['rateDate']??'');
        if($currencyId<1||$rate<=0||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$rateDate))error_response('Invalid currency rate',400,'validation_error');
        $statement=$pdo->prepare("INSERT INTO currency_rates(currency_id,rate,rate_date,recorded_by_user_id) VALUES(:currencyId,:rate,:rateDate,:userId)");
        $statement->execute(['currencyId'=>$currencyId,'rate'=>$rate,'rateDate'=>$rateDate,'userId'=>(int)$user['id']]);
        $id=(int)$pdo->lastInsertId();
        $statement=$pdo->prepare("SELECT r.id,r.currency_id AS currencyId,c.name AS currencyName,c.code AS currencyCode,r.rate,r.rate_date AS rateDate,r.recorded_by_user_id AS recordedByUserId,u.display_name AS recordedByName,r.created_at AS createdAt FROM currency_rates r JOIN currencies c ON c.id=r.currency_id JOIN users u ON u.id=r.recorded_by_user_id WHERE r.id=:id");
        $statement->execute(['id'=>$id]);$row=$statement->fetch();$row['id']=$id;$row['currencyId']=(int)$row['currencyId'];$row['rate']=(float)$row['rate'];$row['recordedByUserId']=(int)$row['recordedByUserId'];json_response($row,201);
    }
    if (preg_match('#^/currency-rates/([1-9][0-9]*)$#',$path,$match)&&$method==='DELETE') {
        $statement=$pdo->prepare("DELETE FROM currency_rates WHERE id=:id");$statement->execute(['id'=>(int)$match[1]]);
        if($statement->rowCount()===0)error_response('Currency rate not found',404,'not_found');http_response_code(204);exit;
    }
    if ($path === '/favorites' && $method === 'GET') {
        $statement=$pdo->prepare("SELECT id,path,title,sort_order AS sortOrder,created_at AS createdAt FROM user_favorites WHERE user_id=:userId ORDER BY sort_order,id");$statement->execute(['userId'=>(int)$user['id']]);$rows=$statement->fetchAll();foreach($rows as &$row){$row['id']=(int)$row['id'];$row['sortOrder']=(int)$row['sortOrder'];}json_response($rows);
    }
    if ($path === '/favorites' && $method === 'POST') {
        $body=json_body();$favoritePath=trim((string)($body['path']??''));$title=trim((string)($body['title']??''));
        if($favoritePath===''||$title==='')error_response('Invalid favourite',400,'validation_error');
        try{$statement=$pdo->prepare("INSERT INTO user_favorites(user_id,path,title) VALUES(:userId,:path,:title)");$statement->execute(['userId'=>(int)$user['id'],'path'=>$favoritePath,'title'=>$title]);}catch(PDOException $error){if((string)$error->getCode()==='23000')error_response('Already a favourite',409,'conflict');throw $error;}
        json_response(['id'=>(int)$pdo->lastInsertId(),'path'=>$favoritePath,'title'=>$title,'sortOrder'=>0,'createdAt'=>date(DATE_ATOM)],201);
    }
    if (preg_match('#^/favorites/([1-9][0-9]*)$#',$path,$match)&&$method==='DELETE') {
        $statement=$pdo->prepare("DELETE FROM user_favorites WHERE id=:id AND user_id=:userId");$statement->execute(['id'=>(int)$match[1],'userId'=>(int)$user['id']]);if($statement->rowCount()===0)error_response('Favourite not found',404,'not_found');http_response_code(204);exit;
    }
    if ($path === '/session/login-info' && $method === 'GET') {
        json_response(['id'=>(int)$user['id'],'username'=>$user['username'],'displayName'=>$user['display_name'],'lastLoginAt'=>$user['last_login_at']??null]);
    }
    if ($path === '/items/price-lookup' && $method === 'GET') {
        $where='';$params=[];
        if(isset($_GET['itemId'])&&(int)$_GET['itemId']>0){$where='i.id=:itemId';$params['itemId']=(int)$_GET['itemId'];}
        elseif(isset($_GET['barcode'])&&trim((string)$_GET['barcode'])!==''){$where='i.barcode=:barcode';$params['barcode']=trim((string)$_GET['barcode']);}
        else error_response('barcode or itemId is required',400,'validation_error');
        $statement=$pdo->prepare("SELECT i.id,i.name,i.barcode,i.unit,i.sale_price AS retailPrice,COALESCE(m.wholesale_price,0) AS wholesalePrice,COALESCE(m.special_price,0) AS specialPrice,COALESCE(m.extra_price,0) AS extraPrice FROM items i LEFT JOIN item_catalog_metadata m ON m.item_id=i.id WHERE {$where} AND i.deleted_at IS NULL LIMIT 1");$statement->execute($params);$row=$statement->fetch();if(!$row)error_response('Item not found',404,'not_found');
        foreach(['id'] as $key)$row[$key]=(int)$row[$key];foreach(['retailPrice','wholesalePrice','specialPrice','extraPrice'] as $key)$row[$key]=(float)$row[$key];
        $statement=$pdo->prepare("SELECT w.id AS warehouseId,w.name AS warehouseName,s.quantity FROM warehouse_stock s JOIN warehouses w ON w.id=s.warehouse_id WHERE s.item_id=:itemId AND w.deleted_at IS NULL");$statement->execute(['itemId'=>$row['id']]);$stock=$statement->fetchAll();foreach($stock as &$entry){$entry['warehouseId']=(int)$entry['warehouseId'];$entry['quantity']=(float)$entry['quantity'];}$row['stock']=$stock;json_response($row);
    }
    return false;
}
$GLOBALS['rawand_modules'][] = 'shell_dispatch';