for (let i = 0 ; i < localStorageAccount.length; i++){
    const localStorageAccountObject = (localStorageAccount[i]);
  
    if (localStorageAccountObject.name === name.value){
        console.log('I found', name.value, 'in the array');
        const userAccount = new CreateUserAccount(name.value);
        localStorageAccount = [];
        localStorageAccount.push(userAccount);




        




signUp.addEventListener('click', () => {

    localStorage.setItem('currentUser', name.value);

    let localStorageAccount = JSON.parse(localStorage.getItem('userAccount'));

    const userAccount = new CreateUserAccount(name.value);

    if (localStorageAccount){
        localStorageAccount.push(userAccount);
    } else {
        localStorageAccount = [];
        localStorageAccount.push(userAccount);
    }
    function CreateUserAccount(name, avatar) {
        this.name = name;
        this.recordingSession = {};
        this.userAvatar = avatar;
    }
    console.log(localStorageAccount);
    const stringyUserAccount = JSON.stringify(localStorageAccount);
    localStorage.setItem('userAccount', stringyUserAccount);
    window.location.href = './synth';
});
