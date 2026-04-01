POST Lookup NIN Mid
https://api.onepipe.io/v2/transact

HEADERS

Authorization: Bearer dthEjKlKSL30mNVwbpne_0e1a5973b7a2430bbc6d2f6032ea17f1

Signature: 3a2b58350e8068507e6b5bff106850a5

Content-Type: application/json

Body

{
  "request_ref":"111111111", 
  "request_type":"lookup_nin_mid",
  "auth": {
    "type": "nin", 
    "secure": "{{auth.nin}}",
    "auth_provider": "Demoprovider",
    "route_mode": null
  },
  "transaction": {
    "mock_mode": "live", 
    "transaction_ref": "{{transaction-ref}}", 
    "transaction_desc": "A random transaction", 
    "transaction_ref_parent": null, 
    "amount": 0,
    "customer":{
    	"customer_ref": "DemoApp_Customer007",
    	"firstname": "Uju",
    	"surname": "Usmanu",
    	"email": "ujuusmanu@gmail.com",
    	"mobile_no": "234802343132"
    },
    "meta":{
    	"a_key":"a_meta_value_1",
    	"b_key":"a_meta_value_2"
    },
    "details": {
    }
  }
}

Example Request: Lookup NIN Min - Successful

curl --location 'https://api.onepipe.io/v2/transact' \
--header 'Authorization: Bearer dthEjKlKSL30mNVwbpne_0e1a5973b7a2430bbc6d2f6032ea17f1' \
--header 'Signature: 3a2b58350e8068507e6b5bff106850a5' \
--header 'Content-Type: application/json' \
--data-raw '{
  "request_ref":"111111111", 
  "request_type":"lookup_nin_mid",
  "auth": {
    "type": "nin", 
    "secure": "{{auth.nin}}",
    "auth_provider": "Demoprovider",
    "route_mode": null
  },
  "transaction": {
    "mock_mode": "live", 
    "transaction_ref": "{{transaction-ref}}", 
    "transaction_desc": "A random transaction", 
    "transaction_ref_parent": null, 
    "amount": 0,
    "customer":{
    	"customer_ref": "DemoApp_Customer007",
    	"firstname": "Uju",
    	"surname": "Usmanu",
    	"email": "ujuusmanu@gmail.com",
    	"mobile_no": "234802343132"
    },
    "meta":{
    	"a_key":"a_meta_value_1",
    	"b_key":"a_meta_value_2"
    },
    "details": {
    }
  }
}'

Example Request: Lookup NIN Min - Waiting...

curl --location 'https://api.onepipe.io/v2/transact' \
--header 'Authorization: Bearer dthEjKlKSL30mNVwbpne_0e1a5973b7a2430bbc6d2f6032ea17f1' \
--header 'Signature: 3a2b58350e8068507e6b5bff106850a5' \
--header 'Content-Type: application/json' \
--data-raw '{
  "request_ref":"111111111", 
  "request_type":"lookup_nin_mid",
  "auth": {
    "type": "nin", 
    "secure": "{{auth.nin}}",
    "auth_provider": "Demoprovider",
    "route_mode": null
  },
  "transaction": {
    "mock_mode": "live", 
    "transaction_ref": "{{transaction-ref}}", 
    "transaction_desc": "A random transaction", 
    "transaction_ref_parent": null, 
    "amount": 0,
    "customer":{
    	"customer_ref": "DemoApp_Customer007",
    	"firstname": "Uju",
    	"surname": "Usmanu",
    	"email": "ujuusmanu@gmail.com",
    	"mobile_no": "234802343132"
    },
    "meta":{
    	"a_key":"a_meta_value_1",
    	"b_key":"a_meta_value_2"
    },
    "details": {
    }
  }
}'

Example Response: 200 OK

Body

{
  "status": "WaitingForOTP",
  "message": "Please enter the OTP sent to 2348022****08, use 12345678 as your OTP",
  "data": {
    "provider_response_code": "900T0",
    "provider": "Demoprovider",
    "errors": null,
    "error": null,
    "provider_response": null,
    "client_info": {
      "name": null,
      "id": null,
      "bank_cbn_code": null,
      "bank_name": null,
      "console_url": null,
      "js_background_image": null,
      "css_url": null,
      "logo_url": null,
      "footer_text": null,
      "show_options_icon": false,
      "paginate": false,
      "paginate_count": 0,
      "options": null,
      "merchant": null,
      "colors": null,
      "meta": null
    }
  }
}

Example Response:

Headers (5)

Date:  Sun, 05 Jul 2020 23:25:02 GMT

Content-Type:  application/json; charset=utf-8

Content-Length: 518

Connection: keep-alive

Server: Kestrel