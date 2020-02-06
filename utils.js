//this class builds a user account with an empty object 
export class ConstructAccount {
    constructor(name) {
        this.name = name;
        this.recordingSession = {};
    }
}
//takes in the user account array and the new user account, pushes the account into the user array then pushes it back into local storage after stringify
function createUserAccount(userAccountArray, userAccount) {
    userAccountArray.push(userAccount);
    localStorage.setItem('userAccounts', JSON.stringify(userAccountArray));
}   
//sets the state of current user
function setCurrentUser(name){
    localStorage.setItem('currentUser', name);
}
//grabs user accounts array from local storage
function getUserAccounts(){
    const userAccounts = JSON.parse(localStorage.getItem('userAccounts'));
    return userAccounts;
}
export { setCurrentUser, createUserAccount, getUserAccounts };