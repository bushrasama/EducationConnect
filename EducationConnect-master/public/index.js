var socket = io()
$(() => {
    $("#send").click(() => {
        var message = {
            name: $("#name").val(),
            message: $("#message").val()
        }
        postMessage(message)
    })
    getMessages()
})

socket.on('message', addMessage)



function addMessages(message) {
    $("#messages").append(`<h4> ${message.name} </h4> <p> ${message.message} </p>`)
}

function postMessage(message) {
    $.post('http://localhost:3002/messages', message)
}


function getMessages() {
    $.get('http://localhost:3002/messages', (data) => {
        data.forEach(addMessages);
    })
}