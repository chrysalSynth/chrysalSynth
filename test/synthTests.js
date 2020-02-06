// IMPORT MODULES under test here:
import { ConstructAccount, createUserAccount, setCurrentUser, getUserAccounts } from '../utils.js';

const test = QUnit.test;

//this test checks if the construct account function works
test('construct a user', function(assert) {
    //function that is being tested (setCurrentUser)
    const userAccount = new ConstructAccount('Cody');
    const expected = 'Cody';
    const result = userAccount.name;
    assert.equal(result, expected);
});

//this test determines if the setCurrentUser function works
test('set the current user', function(assert) {
   //function that is being tested (setCurrentUser)
    setCurrentUser('josh');
    const expected = 'josh';
    const result = localStorage.getItem('currentUser');
    assert.equal(result, expected);
});

//this test determines if the createUserAccount function works
test('create a user account and push to local storage', function(assert) {
   
    const userAccount = {
        name: 'george',
        recordingSessions: {}
    };    
    const localStorageAccounts = [];

    //function that is being tested (createUserAccount)
    createUserAccount(localStorageAccounts, userAccount);

    const expected = 'george';
    const getUser = localStorage.getItem('userAccounts');
    const parsedGetUser = JSON.parse(getUser);
    const result = (parsedGetUser[0].name);
    
    assert.equal(result, expected);
});

//this test determines if the getUserAccounts function works
test('retrieve all user accounts', function(assert) {

    const userAccount = {
        name: 'MIKE',
        recordingSessions: {}
    };    
    const localStorageAccounts = [];
    createUserAccount(localStorageAccounts, userAccount);
    const expected = 'MIKE';
    //function that is being tested "getUserAccounts()"
    const getUserArray = getUserAccounts();
    const firstUser = getUserArray[0];
    const result = (firstUser.name);
    
    assert.equal(result, expected);
});


