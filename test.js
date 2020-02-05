for (let i = 0 ; i < localStorageAccount.length; i++){
    const localStorageAccountObject = (localStorageAccount[i]);
  
    if (localStorageAccountObject.name === name.value){
        console.log('I found', name.value, 'in the array');
        const userAccount = new CreateUserAccount(name.value);
        localStorageAccount = [];
        localStorageAccount.push(userAccount);




        const name = document.getElementById('name');



        
const signUp = document.getElementById('signUp');

signUp.addEventListener('click', () => {

    localStorage.setItem('currentUser', name.value);
    // get user account data from localStorage
    let userAccounts = localStorage.getItem('userAccount');
    console.log(userAccounts);
    let localStorageAccount = JSON.parse(localStorage.getItem('userAccount'));
    const userAccount = new CreateUserAccount(name.value);
    if (!localStorageAccount)
        localStorageAccount = [];
        localStorageAccount.push(userAccount);
    
    for (let i = 0 ; i < localStorageAccount.length; i++){
        const localStorageAccountObject = (localStorageAccount[i]);
        if (localStorageAccountObject.name === name.value){
            console.log('found', name.value);}
        else {
            localStorageAccount.push(userAccount);
            const stringyUserAccount = JSON.stringify(localStorageAccount);
            localStorage.setItem('userAccount', stringyUserAccount);
            console.log('newAccount', userAccount);
            console.log('ls object', localStorageAccountObject);
        }
    }
    function CreateUserAccount(name) {
        this.name = name;
        this.recordingSession = {};
    }
    //window.location.href = './synth';
});
