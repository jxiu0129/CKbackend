const findEvent = () => {
    let target = $('#query').val();
    // location.href = 'localhost:3000/eventslist?search=' + target;
    $.ajax({
        url: `http://localhost:3000/eventslist?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `http://localhost:3000/eventslist?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
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

const findEventB = () => {
    let target = $('#query').val();
    // location.href = 'localhost:3000/eventslist?search=' + target;
    $.ajax({
        url: `http://localhost:3000/eventslistBLI?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `http://localhost:3000/eventslistBLI?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};

const findUser = () => {
    let target = $('#query').val();
    // location.href = 'localhost:3000/eventslist?search=' + target;
    $.ajax({
        url: `http://localhost:3000/sponsor/events/:eventid/attendancelist?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `http://localhost:3000/sponsor/events/:eventid/attendancelist?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};