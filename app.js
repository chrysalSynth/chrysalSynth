const name = document.getElementById('name');
const signUp = document.getElementById('signUp');
const avatar1_span = document.getElementById('avatar1');
const avatar2_span = document.getElementById('avatar2');
const avatar3_span = document.getElementById('avatar3');

signUp.addEventListener('click', () => {

    localStorage.setItem('currentUser', name.value);

    let localStorageAccount = JSON.parse(localStorage.getItem('userAccount'));

    const userAccount = new CreateUserAccount(name.value, avatar);

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
   // window.location.href = './synth';
});

// avatar1_span.addEventListener('click', function() {
//     window.location.href = './synth';
// });

// avatar2_span.addEventListener('click', function() {
//     window.location.href = './synth';
// });

// avatar3_span.addEventListener('click', function() {
//     window.location.href = './synth';
// });

