// 得到socket对象
var socket = io();

// 获取用户名
var name = $('#name').text();
// 将用户名发送到服务器
socket.emit('login', name);

// 获取在线用户列表
socket.on('users', function(users) {
	var name;
	for (var i = 0; i < users.length; i++) {
		name = users[i];
		$('#users').append('<li class=' + name + ' onclick=addFri(this.className)>' + name + '</li>')
	}
	$('#unum').text(users.length);
})

// 获取好友列表
socket.on('friends', function(friends) {
	var name;
	for (var i = 0; i < friends.length; i++) {
		name = friends[i];
		$('#friends').append('<li class=' + name + '>' + name + '</li>')
	}
	$('#fnum').text(friends.length);
})

// 退出登录
$(function() {
	$('#logout').click(function(event) {
		window.location.replace('/logout');
	});
})

// 添加好友请求
function addFri(name) {
	if (confirm('确定请求添加' + name + '为好友吗?')) {
		socket.emit('addFri', name);
	}
}
socket.on('friErr', function(msg) {
	alert(msg);
})
// 接收好友请求
socket.on('addFri', function(name) {
	socket.emit('reply', confirm(name + '请求添加你为好友，是否同意?'))
})

// 接收回复信息
socket.on('reply', function(msg) {
	if (msg.reply) {
		alert(msg.name + '已同意您的好友请求!');
	} else {
		alert(msg.name + '拒绝了您的好友请求!');
	}
})

// 接收添加结果
socket.on('addFriRes', function(msg) {
	if (msg.result) {
		alert('添加好友' + msg.name + '成功!');
		$('#friends').append('<li class=' + msg.name + '>' + msg.name + '</li>');
		$('#fnum').text(function(i, org) {
			return ++org;
		});
	} else {
		alert('添加好友' + msg.name + '失败!');
	}
})

// 接收进入聊天室用户信息
socket.on('newUser', function(name) {
	$('#users').append('<li class=' + name + ' onclick=addFri(this.className)>' + name + '</li>');
	$('#unum').text(function(i, org) {
		return ++org;
	});
})

// 点击发送消息
$('#btn').click(function() {
	emitMsg();
});

// 回车发送消息
$('#msg').keydown(function(e) {
	if (e.keyCode == 13) {
		emitMsg();
	}
});

// 发送消息
function emitMsg() {
	if ($("#msg").val().match(/^\ *$/)) {
		alert('发送内容不能为空！');
		return;
	}
	if ($('#msg').val().length > 100) {
		alert('发送内容过大！');
		return;
	}

	// 把文本框的内容发送到服务器
	socket.emit("clientOut", {
		"name": $('#name').html(),
		"msg": $('#msg').val()
	});
	$('#msg').val("");
}

// 接收群聊信息
socket.on("serverOut", function(serverMsg) {
	console.log(serverMsg);
	// 拼接输出的信息
	var time = (new Date()).toLocaleString();
	var html = '<li class="list-group-item text-primary"><b>' + serverMsg.name + '</b>:' + serverMsg.msg + '<i>(' + time + ')</i>' + '</li>';

	// 插入最新消息
	$(".list-group").prepend(html);
})

// 接收私聊信息
socket.on("priMsg", function(priMsg) {
	console.log(priMsg);
	// 拼接输出的信息
	var time = (new Date()).toLocaleString();
	var html = '<li class="list-group-item text-primary"><b>' + priMsg.name + '</b>:' + priMsg.msg + '<i>(' + time + ')</i>' + '</li>';

	// 插入最新消息
	$(".list-group").prepend(html);
})

// 接收系统信息
socket.on("sysMsg", function(sysMsg) {
	console.log(sysMsg);
	// 拼接输出的信息
	var time = (new Date()).toLocaleString();
	var html = '<li class="list-group-item text-primary sysMsg"><b>' + sysMsg.name + ':</b>' + sysMsg.msg + '<i>(' + time + ')</i>' + '</li>';

	// 插入最新消息
	$(".list-group").prepend(html);
})

// 删除退出用户信息
socket.on('logout', function(name) {
	console.log(name);
	$('#users>li').remove('.' + name);
	$('#unum').text(function(i, org) {
		return --org;
	});
})