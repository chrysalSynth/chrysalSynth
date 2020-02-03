const codyDiv = document.getElementById('cody');
const owenDiv = document.getElementById('owen');
const joshDiv = document.getElementById('josh');
const mikeyDiv = document.getElementById('mikey');
const chrisDiv = document.getElementById('chris');

const bioContainer = document.getElementById('about-me-bio');



function revealBio() {
    const showBio = document.getElementById('show-bio');
    if (showBio.style.display === 'none') {
        showBio.style.display = 'block';
    } else {
        showBio.style.display = 'none';
    }
}













// bioContainer.addEventListener('click', showBio);

// function showBio(hidden) {
//     const revealBio = document.getElementsByClassName('hidden');
//     if (revealBio[0].offsetWidth > 0 && revealBio[0].offsetHeight > 0) {
//         revealBio[0].style.visibility = 'visible';
//     }

// } 



// function showBio() {
//     bioContainer.classList.remove('hidden');
// }

// going to add event listeners to each of our avatars to reveal a short bio about each one of us

// function readAboutMeBio() {
//     codyDiv.addEventListener('click', function () {

//     });