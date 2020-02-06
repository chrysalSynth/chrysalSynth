// IMPORT MODULES under test here:
import { createUserAccount, setCurrentUser, getUserAccounts } from '../utils.js';

const test = QUnit.test;

test('set the current user', function(assert) {
   //function that is being tested (setCurrentUser)
    setCurrentUser('josh');
    const expected = 'josh';
    const result = localStorage.getItem('currentUser');
    assert.equal(result, expected);
});

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


