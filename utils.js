export function findByID(ID, array) {
    for (let i = 0 ; i < array.length; i++) {
        const userName = array[i];
        if (userName.id === ID){
            return userName;
        }
    } }