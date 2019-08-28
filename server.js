var express = require('express');
var app = express();
var server = require('http').Server(app);

// POST数据解析模块
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
	extended: false
}));

// 启用session
var session = require('express-session');
app.use(session({
	secret: '000000',
	resave: true,
	saveUninitialized: true,
	// cookie:{maxAge:5000} // 设置有效时间,单位:ms
}))

// 连接数据库
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'shicons',
	password: '000000',
	database: 'chatroom'
});
connection.connect();

// 创建socket服务
var io = require('socket.io')(server);

app.set('view engine', 'ejs');

app.use(express.static('./public'));

// 注册页面
app.get('/regPage', function(req, res) {
	res.render('register.ejs');
});

// 注册操作
app.post('/regAct', function(req, res) {
	var values = req.body;
	var sql = 'INSERT INTO `user` VALUES(0,?,?,?)';
	var params = [values.name, values.tel, values.pwd];
	connection.query(sql, params, function(error, result) {
		if (result && result.affectedRows) {
			// 注册成功,进入首页
			req.session.name = values.name;
			res.redirect('/');
		} else {
			// 注册失败，返回注册页
			req.session.name = null;
			res.redirect('/regPage');
		}
	});
});

// 登录页面
app.get('/loginPage', function(req, res) {
	res.render('login.ejs');
});

// 登录操作
app.post('/loginAct', function(req, res) {
	var sql = 'SELECT `name` FROM `user` WHERE `tel`="' + req.body.tel + '"';
	connection.query(sql, function(error, result) {
		req.session.name = result[0].name;
		res.redirect('/');
	});
});

// AJAX验证注册及登录信息
app.use('/check', function(req, res) {
	switch (req.path) {
		// 验证注册用户名
		case '/name':
			var name = req.body.name;
			var sql = 'SELECT `name` FROM `user` WHERE `name`="' + name + '"';
			break;
		// 验证注册手机号
		case '/tel':
			var tel = req.body.tel;
			var sql = 'SELECT `tel` FROM `user` WHERE `tel`="' + tel + '"';
			break;
		// 验证登录信息
		case '/login':
			var tel = req.body.tel;
			var pwd = req.body.pwd;
			var sql = 'SELECT `name` FROM `user` WHERE `tel`="' + tel + '" AND `pwd`="' + pwd + '"';
			break;
	}
	// 从数据库获取相应信息
	connection.query(sql, function(error, result) {
		var str = JSON.stringify(result);
		if (str.length == 2) {
			res.end('0');
		} else {
			res.end('1');
		}
	});
})

// 退出登录
app.get('/logout', function(req, res) {
	delete req.session.name;
	res.redirect('/');
})

// 进入首页
app.get('/', function(req, res) {
	if (req.session.name != null) {
		res.render('index.ejs', {
			'name': req.session.name
		});
	} else {
		res.redirect('/loginPage');
	}
});

// 监听客户端的连接
var sockets = [];
var users = [];
io.on('connection', function(socket) {
	// 监听客户端的登录
	socket.on('login', function(name) {
		// 发送新登录客户的用户名
		for (var i in sockets) {
			sockets[i].emit('newUser', name);
			sockets[i].emit('sysMsg', {
				'name': '#系统消息',
				'msg': name + '进入聊天室.'
			});
		}
		// 绑定用户账号和socket
		sockets[name] = socket;
		socket['name'] = name;

		// 发送在线用户列表
		socket.emit('users', users);
		// 发送好友信息列表
		var sql = 'SELECT `friends` FROM `friends` WHERE `user`="' + name + '"';
		connection.query(sql, function(error, result) {
			var friends = [];
			for (var i in result) {
				friends.push(result[i].friends);
			}
			socket.emit('friends', friends);
		})

		// 加入在线用户列表
		users.push(name);
		console.log(name + '连接成功');
	})
	// 监听客户端发送的消息
	socket.on('clientOut', function(clientMsg) {
		console.log(clientMsg);
		var name = clientMsg.name
		var msg = clientMsg.msg;
		var res = msg.match(/^@(.+):(.+)/);
		// 私聊信息
		if (res) {
			// 用户在线,发送消息
			if (sockets[res[1]]) {
				sockets[res[1]].emit('priMsg', {
					'name': name + '@你',
					'msg': res[2]
				});
				socket.emit('priMsg', {
					'name': '@' + res[1],
					'msg': res[2]
				});
			} else {
				// 用户不在线,返回错误提示
				socket.emit('sysMsg', {
					'name': '#系统提示',
					'msg': '发送失败,您要私聊的用户不在线!'
				})
			}
			return;
		}
		// 向所有的已连接客户端进行广播消息
		io.emit('serverOut', clientMsg);
	})

	// 加好友事件
	socket.on('addFri', function(name) {
		// 验证好友是否存在
		var sql = 'SELECT * FROM `friends` WHERE `user`="' + socket['name'] + '" AND `friends`="' + name + '"';
		connection.query(sql, function(error, result) {
			var str = JSON.stringify(result);
			if (str.length != 2) {
				socket.emit('friErr', '好友已存在!');
			} else {
				// 请求
				sockets[name].emit('addFri', socket['name']);
				// 回复
				sockets[name].on('reply', function(reply) {
					// console.log(reply);
					socket.emit('reply', {
						'reply': reply,
						'name': name
					});
					// 添加到数据库
					if (reply) {
						// 添加好友信息到数据库
						var sql = 'INSERT INTO `friends` VALUES(?,?)';
						var params = [socket['name'], name];
						connection.query(sql, params, function(error, result) {
							if (result.affectedRows) {
								// 添加好友信息到数据库
								var sql = 'INSERT INTO `friends` VALUES(?,?)';
								var params = [name, socket['name']];
								connection.query(sql, params, function(error, result) {
									// 发送添加结果
									socket.emit('addFriRes', {
										'result': result.affectedRows,
										'name': name
									});
									sockets[name].emit('addFriRes', {
										'result': result.affectedRows,
										'name': socket['name']
									});
								});
							} else {
								socket.emit('addFriRes', {
									'result': result.affectedRows,
									'name': name
								});
								sockets[name].emit('addFriRes', {
									'result': result.affectedRows,
									'name': socket['name']
								});
							}
						});
					}
				})
			}
		})
	})

	// 监听客户端的断开
	socket.on('disconnect', function() {
		var name = socket['name'];
		console.log(name + '断开连接');
		delete sockets[name];

		// for (var i = 0; i < users.length; i++) {
		// 	if(users[i]==name){
		// 		users.splice(i,1)
		// 	}
		// }

		// users.forEach(function(ele,index,arr){
		// 	if (ele==name) {
		// 		arr.splice(index,1);
		// 	}
		// })

		// 从在线用户列表中删除
		users.splice(users.indexOf(name), 1);
		console.log('删除 ' + name);
		console.log(users);
		// 发送下线用户信息
		for (var i in sockets) {
			sockets[i].emit('logout', name);
		}
		io.emit('sysMsg', {
			'name': '#系统消息',
			'msg': name + '退出聊天室.'
		});
	})
})

server.listen(3000, function() {
	console.log('服务器已启动');
});