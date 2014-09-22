var frisby = require('frisby');
// Put your private api key here
var API_KEY = '<YOUR_PRIVATE_KEY>';
var URL = 'https://api.paymill.com/v2.1/';
var OFFERS_URL = URL + 'offers';
var AUTH = "Basic " + new Buffer(API_KEY + ":").toString("base64");


frisby.globalSetup({ // globalSetup is for ALL requests
  request: {
    // Set authorization header
    headers: { 'Authorization': AUTH }
  }
});
// Auxiliary variable
var id = '';
// Test offer date
var data = {
    "name": "Test Plan",
    "amount": "2500",
    "currency": "EUR",
    "trial_period_days": 30,
    "interval": "1 MONTH"
};

/*
Since Frisby is based on Jasmine and Jasmine itself runs with Node.js which works asynchronous, the tests has to be nested to be executed in the right order.
*/

frisby.create('Paymill: List empty offers')
.get(OFFERS_URL)
.expectStatus(200)
.expectHeaderContains('content-type', 'application/json')
.expectJSONTypes({
    data: Array,
    data_count: String,
    mode: String
 })
 //.inspectBody()
.expectJSON({
    "data":
    [
    ],
    "data_count": "0",
    "mode": "test"
})
// Create a new offer
.afterJSON(function (api) {
    frisby.create('Paymill: Create offer')
    .post(OFFERS_URL, data)
    .expectStatus(200)
    .expectJSONTypes({
        data: Object,
        mode: String
    })
    //.inspectBody()
    // Let''s query this new created offer
    .afterJSON(function (api) {
        // Saving id for the new created offer
        id = api.data.id;
        data.interval = api.data.interval;
        frisby.create('Paymill: Offer details')
        .get(OFFERS_URL + '/' + id)
        .expectStatus(200)
        .expectHeaderContains('content-type', 'application/json')
        .expectJSONTypes({
            data: Object,
            //app_id: Object,
            mode: String
         })
        //.inspectBody()
        .expectJSON({
            "data": {
                "id": id,
                "name": "Test Plan",
                "amount": 2500,
                "currency": "EUR",
                "trial_period_days": 30,
                "interval": "1 MONTH",
                "subscription_count":{
			        "active":0,
			        "inactive":0
		        },
            },
            //"app_id": null,
            "mode": "test"
        })
        .afterJSON(function () {
            // Changing name
            data.name = "Test Plan 2";
            frisby.create('Paymill: Update Offer details')
            // Put modified data object
            .put(OFFERS_URL + '/' + id, data)
            .expectStatus(200)
            .expectJSONTypes({
                data: Object,
                mode: String
            })
            .expectJSON({ 
                "data": {
                    "id": data.id,
                    "name": "Test Plan 2",
                },
                //"app_id": null,
                "mode": "test"
            })
            .afterJSON(function() {
                frisby.create('Paymill: Delete Offer')
                .delete( OFFERS_URL + '/' + id + '?remove_with_subscriptions=false' )
                .expectStatus(200)
                .expectHeaderContains('content-type', 'application/json')
                .expectJSONTypes({
                    data: Array,
                    mode: String
                 })
                 .expectJSON({
                    "data":[
                    ],
                    "mode": "test"
                })
                .toss(); // End delete
            })
            .toss(); // End update
        })
        .toss(); // End query
    })
    .toss(); // End create
})
.toss(); // End list

