const findEvent = () => {
    let target = $('#query').val();
    // location.href = 'attend.nccu.edu.tw/eventslist?search=' + target;
    $.ajax({
        url: `http://attend.nccu.edu.tw/eventslist?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `http://attend.nccu.edu.tw/eventslist?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};

const logOut = () => {
    $.ajax({
        url: 'http://attend.nccu.edu.tw/logout', 
        success: () => {
            console.log('success log out');
            window.location.href = 'http://attend.nccu.edu.tw';
        },
        error: err => console.log('error log out:' + err),
    });
};

const findEventB = () => {
    let target = $('#query').val();
    // location.href = 'attend.nccu.edu.tw/eventslist?search=' + target;
    $.ajax({
        url: `http://attend.nccu.edu.tw/eventslistBLI?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `http://attend.nccu.edu.tw/eventslistBLI?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};