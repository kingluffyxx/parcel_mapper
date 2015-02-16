<?php
header('Pragma: no-cache');
header("Expires: 0"); 
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Content-Type: text/x-csv");
header("Content-Disposition: attachment;filename=\"maintenanceReport.csv\""); 

if (isset($_POST["reportData"]) && !empty($_POST["reportData"])) {
    $text = $_POST["reportData"];
	$hydrant = $_POST["hydrant"];
	$myArray = explode(',', $text);
	$arrlength=count($myArray);
	echo "Maintenance Report Hydrant Number: ".$hydrant;
	echo "\n";
	echo "\n";
echo "HYDRAN TEST DATE,TESTER,ACCEPT,REJECT,FLUSH,AUX VALVE,GPM,FLOW PSI,STATIC PSI,BARREL LEAKAGE,GLAND LEAKAGE,DRAINAGE,VALVE LEAKAGE,STEM LUBRICATION,NOZZLE LUBRICATION,CHAINS,CAP GASKETS,OPERATINGNUT,NOZZLE THREADS,PHYSICAL APPEARANCE,TURBIDITY START,TURBIDITY FINISH,TEMP START,TEMP FINISH,CHLORINE START,CHLORINE FINISH,REMARKS\n";
	for($x=0;$x<$arrlength;$x++)
	  {

		if($x > 0 && $x % 26 == 0){
			echo "\n".$myArray[$x].",";
		}
		else {
			echo $myArray[$x].",";
		}
		
	  }
}else{  
    echo "N0, data is not set";
}

?>