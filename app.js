const name = document.getElementById('name');
const signUp = document.getElementById('signUp');

signUp.addEventListener('click', () => {
    //get local storage user account data and parse them
    let localStorageAccounts = JSON.parse(localStorage.getItem('userAccounts'));
    //set the current user in local storage to the user entered value
    localStorage.setItem('currentUser', name.value);
    // get user account data from localStorage
    console.log(localStorageAccounts);
    //create user account from form data
    const userAccount = new CreateUserAccount(name.value);
    //if local storage accounts don't exist yet... create an empty array
    if (!localStorageAccounts){
        localStorageAccounts = [];
        //push the constructed userAccount array into localStorage Account Array
        localStorageAccounts.push(userAccount);
        //set all of that into local storage
        localStorage.setItem('userAccounts', JSON.stringify(localStorageAccounts));
    } 
    else {
        //if localStorageAccounts DO exist... start looping through them to find a match
        for (let i = 0 ; i < localStorageAccounts.length; i++){
            const localStorageAccountObject = (localStorageAccounts[i]);
            //if they match... shoot them over to the synth page
            if (localStorageAccountObject.name === name.value){
                window.location.href = './synth';
                return;
            } 
        }
        localStorageAccounts.push(userAccount);
        localStorage.setItem('userAccounts', JSON.stringify(localStorageAccounts));
    }
    function CreateUserAccount(name) {
        this.name = name;
        this.recordingSession = {};
    }
    window.location.href = './synth';
});