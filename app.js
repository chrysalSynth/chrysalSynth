import { ConstructAccount, setCurrentUser, createUserAccount, getUserAccounts } from './utils.js';

//get the name value from end user and the signUp button for event listener
const formName = document.getElementById('name');
const signUp = document.getElementById('signUp');

signUp.addEventListener('click', () => {
    //get user name value and uppercase the input
    const name = formName.value.toUpperCase();
    //set the current user in local storage to the user entered value
    setCurrentUser(name);
    //get local storage user account data and parse them
    let userAccountsArray = getUserAccounts();
    //create user account from form data
    const userAccount = new ConstructAccount(name);
    //if the user accounts array in local storage doesn't exist... create one
    if (!userAccountsArray){
        userAccountsArray = [];
        //now push the constructed userAccount into the localStorage Account Array, stringify and push into local storage
        createUserAccount(userAccountsArray, userAccount);
    } 
    else {
        //if a userAccountsArray DOES exist... start looping through to see if the current user has already created an account
        for (let i = 0 ; i < userAccountsArray.length; i++){
            const userAccountObject = (userAccountsArray[i]);
            //if they match... break out of loop and shoot them over to the synth page
            if (userAccountObject.name === name){
                window.location.href = './synth';
                //return to break the loop and not run the remaining lines of code
                return;
            } 
        }
        createUserAccount(userAccountsArray, userAccount);
    }
    //send user to synth page
    window.location.href = './synth';
}); 