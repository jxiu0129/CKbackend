const findEvent = () => {
    let target = $('#query').val();
    location.href = 'localhost:3000/eventslist?search=' + target;
    console.log(target);
};

const logOut = () => {
    $.ajax({
        url: 'http://localhost:3000/logout', 
        success: () => {
            console.log('success log out');
            window.location.href = 'http://localhost:3000';
        },
        error: err => console.log('error log out:' + err),
    });
};