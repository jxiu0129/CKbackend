const findEvent = () => {
    let target = $('#query').val();
    // location.href = 'attend.nccu.edu.tw/eventslist?search=' + target;
    $.ajax({
        url: `https://attend.nccu.edu.tw/eventslist?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `https://attend.nccu.edu.tw/eventslist?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};

const logOut = () => {
    $.ajax({
        url: 'https://attend.nccu.edu.tw/logout', 
        success: () => {
            console.log('success log out');
            window.location.href = 'https://attend.nccu.edu.tw';
        },
        error: err => console.log('error log out:' + err),
    });
};

const findEventB = () => {
    let target = $('#query').val();
    // location.href = 'attend.nccu.edu.tw/eventslist?search=' + target;
    $.ajax({
        url: `https://attend.nccu.edu.tw/eventslistBLI?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `https://attend.nccu.edu.tw/eventslistBLI?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};

const findUser = () => {
    let target = $('#query').val();
    // location.href = 'attend.nccu.edu.tw/eventslist?search=' + target;
    $.ajax({
        url: `http://attend.nccu.edu.tw/sponsor/events/:eventid/attendancelist?search=${target}`,
        success: () => {
            console.log('success find');
            window.location.href = `http://attend.nccu.edu.tw/sponsor/events/:eventid/attendancelist?search=${target}`;
        },
        error: () => console.log('fail to find')
    });
    console.log(target);
};

const downloadCSV = (id) => {
    let btn = confirm('確定要下載嗎？');
    if(btn){ 
        $.ajax({
            url: `http://attend.nccu.edu.tw/exportCSV/${id}`,
            success: () => {
                console.log('success dld');
            },
            error: () => console.log('fail to dld')
        });

    }
};