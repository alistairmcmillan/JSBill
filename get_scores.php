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
	$dbs = new mysqli($server, $user_name, $password, $databaseName);
	
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
