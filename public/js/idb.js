// create variable to hold db connection
let db;
// establish a connection to IndexDB database called 'budgie_smuggler' and set it to version 1
const request = indexedDB.open('budgie_smuggler', 1);

//this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result.db
    //create an object store called "new_budgie"; set to have auto-inc
    db.createObjectStore('new_budgie', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    // when db is successfully created with its object store
    db = event.target.result;

    // check if app is online
    if (navigator.onLine) {
        uploadBudgie();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//executed if we attempt to submit and there's no internet
function saveRecord(record) {
    // open new transaction with db to read and write permissions
    const transaction = db.transaction(['new_budgie'], 'readwrite');

    //access the obj. store for 'new_budgie'
    const budgieObjectStore = transaction.budgieObjectStore('new_budgie');

    // add record to store with add method
    budgieObjectStore.add(record);
};

function uploadBudgie() {
    // open a transaction on db
    const transaction = db.transaction(['new_budgie'], 'readwrite');

    // access object store
    const budgieObjectStore = transaction.objectStore('new_budgie');

    //get all records from store and set to a variable
    const getAll = budgieObjectStore.getAll();

    // upon successful .getAll():
    getAll.onsuccess = function () {
        // if there was data in iDB store, send to api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open one more transaction
                    const transaction = db.transaction(['new_budgie'], 'readwrite');
                    //access the new_budgie object store
                    const budgieObjectStore = transaction.objectStore('new_budgie');
                    //clear all items in store
                    budgieObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

//listen for app coming back online
window.addEventListener('online', uploadBudgie);