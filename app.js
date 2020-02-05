const name = document.getElementById('name');
const signUp = document.getElementById('signUp');


signUp.addEventListener('click', () => {
    localStorage.setItem('name', name.value);
    window.location.href = './synth';
});


