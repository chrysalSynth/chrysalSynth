function createUserAccount(userAccountArray, userAccount) {
    userAccountArray.push(userAccount);
    localStorage.setItem('userAccounts', JSON.stringify(userAccountArray));
}   

function setCurrentUser(name){
    localStorage.setItem('currentUser', name);
}

function getUserAccounts(){
    const userAccounts = JSON.parse(localStorage.getItem('userAccounts'));
    return userAccounts;
}

export { setCurrentUser, createUserAccount, getUserAccounts };