//get the name value from end user and the signUp button for event listener
const name = document.getElementById('name');
const signUp = document.getElementById('signUp');

signUp.addEventListener('click', () => {
    //set the current user in local storage to the user entered value
    localStorage.setItem('currentUser', name.value);
    //get local storage user account data and parse them
    let localStorageAccounts = JSON.parse(localStorage.getItem('userAccounts'));
    //create user account from form data
    const userAccount = new CreateUserAccount(name.value);
    //if local storage accounts don't exist yet... create one as an empty array
    if (!localStorageAccounts){
        localStorageAccounts = [];
        //now push the constructed userAccount array into localStorage Account Array
        localStorageAccounts.push(userAccount);
        //stringify that and put into local storage
        localStorage.setItem('userAccounts', JSON.stringify(localStorageAccounts));
    } 
    else {
        //if localStorageAccounts DO exist... start looping through them to see if the current user has already created an account
        for (let i = 0 ; i < localStorageAccounts.length; i++){
            const localStorageAccountObject = (localStorageAccounts[i]);
            //if they match... shoot them over to the synth page
            if (localStorageAccountObject.name === name.value){
                window.location.href = './synth';
                //return to break the loop and not run the remaining lines of code
                return;
            } 
        }
        //if we couldn't find an existing user account create one and push it into localStorageAccount variable
        localStorageAccounts.push(userAccount);
        //now stringify that and put it into local storage
        localStorage.setItem('userAccounts', JSON.stringify(localStorageAccounts));
    }
    // this function constructs the user account
    function CreateUserAccount(name) {
        this.name = name;
        this.recordingSession = {};
    }
    window.location.href = './synth';
});