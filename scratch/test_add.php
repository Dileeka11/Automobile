<?php
$data = array(
    'invoiceId' => 'INV6EAEA', // Or any valid ID
    'amount' => 50000,
    'paymentDate' => '2026-06-11',
    'notes' => '2121'
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true
    )
);
$context  = stream_context_create($options);
$result = file_get_contents('http://localhost/Automobile/backend/api/invoice_payments.php', false, $context);

echo "HTTP response status: \n";
print_r($http_response_header);
echo "\nResponse body:\n";
var_dump($result);
