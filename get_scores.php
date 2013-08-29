<?php 
	$level=$_GET["level"];

	$server = "SERVERNAME";
	$databaseName = "DATABASENAME";
	$tableName = "TABLENAME";
	$user_name = "USERNAME";
	$password = "PASSWORD";
	
	//--------------------------------------------------------------------------
	// 1) Connect to mysql database
	//--------------------------------------------------------------------------
	$db_handle = mysql_connect($server, $user_name, $password);
	$dbs = mysql_select_db($databaseName, $db_handle);
	
	//--------------------------------------------------------------------------
	// 2) Query database for data
	//--------------------------------------------------------------------------
	$pdo=new PDO("mysql:dbname=".$databaseName.";host=".$server,$user_name,$password);
	$statement=$pdo->prepare("SELECT * FROM scores ORDER BY score DESC");
	$statement->execute();
	$array1=$statement->fetchAll(PDO::FETCH_ASSOC);
	
	//--------------------------------------------------------------------------
	// 3) echo result as json 
	//--------------------------------------------------------------------------
	echo json_encode( $array1 );
?>