window.addEventListener('keydown', function(e) {
    const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
    key.classList.add('active');
});

window.addEventListener('keyup', function(e) {
    const key = document.querySelector(`.key[data-key="${e.keyCode}"]`);
    key.classList.remove('active');
});
