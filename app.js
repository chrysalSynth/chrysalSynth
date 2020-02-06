import { setCurrentUser, createUserAccount, getUserAccounts } from './utils.js';

//get the name value from end user and the signUp button for event listener
const formName = document.getElementById('name');
const signUp = document.getElementById('signUp');

signUp.addEventListener('click', () => {
    //get user name value and uppercase the input
    const name = formName.value.toUpperCase();
    //set the current user in local storage to the user entered value
    setCurrentUser(name);
    //get local storage user account data and parse them
    let localStorageAccounts = getUserAccounts();
    //create user account from form data
    const userAccount = new ConstructAccount(name);
    //if local storage accounts don't exist yet... create one as an empty array
    if (!localStorageAccounts){
        localStorageAccounts = [];
        //now push the constructed userAccount array into localStorage Account Array
        //stringify that and put into local storage
        createUserAccount(localStorageAccounts, userAccount);
    } 
    else {
        //if localStorageAccounts DO exist... start looping through them to see if the current user has already created an account
        for (let i = 0 ; i < localStorageAccounts.length; i++){
            const localStorageAccountObject = (localStorageAccounts[i]);
            //if they match... shoot them over to the synth page
            if (localStorageAccountObject.name === name){
                window.location.href = './synth';
                //return to break the loop and not run the remaining lines of code
                return;
            } 
        }
        createUserAccount(localStorageAccounts, userAccount);
    }
    // this function constructs the user account
    function ConstructAccount(name) {
        this.name = name;
        this.recordingSession = {};
    }
    window.location.href = './synth';
});
