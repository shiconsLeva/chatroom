$(function() {
	$('#login').css('color', '#fa2424')
	// 跳转登录页
	$('#login').click(function(e) {
		e.preventDefault()
		window.location.href = '/loginPage'
	})
})

// 注册信息验证
function check(name) {
	let value = $('input[name$="' + name + '"]').val()
	let result
	switch (name) {
		// 账户名验证
		case 'name':
			// 格式验证
			let RE = /^\w{3,12}$/
			if (!value.match(RE)) {
				$('#np').text('* 用户名格式不正确!')
				$('#np').css('color', '#fa2424')
				result = false
			} else {
				// 数据库验证
				$.ajax({
					async: false,
					type: 'post',
					url: '/check/name',
					data: {
						name: value
					},
					success: function(data, textStatus, xhr) {
						if (data === '1') {
							$('#np').text('* 用户名已被占用!')
							$('#np').css('color', '#fa2424')
							result = false
						} else {
							$('#np').text('验证通过!')
							$('#np').css('color', 'green')
							result = true
						}
					}
				})
			}
			break

			// 手机号验证
		case 'tel':
			// 格式验证
			let RE = /^1(3\d|4[5-9]|5[0-35-9]|66|7[03-8]|8\d|9[89])\d{8}$/
			if (!value.match(RE)) {
				$('#tp').text('* 手机号格式不正确!')
				$('#tp').css('color', '#fa2424')
				result = false
			} else {
				// 数据库验证
				$.ajax({
					sync: false,
					type: 'post',
					url: '/check/tel',
					data: {
						tel: value
					},
					success: function(data, textStatus, xhr) {
						if (data === '1') {
							$('#tp').text('* 手机号已被注册!')
							$('#tp').css('color', '#fa2424')
							result = false
						} else {
							$('#tp').text('验证通过!')
							$('#tp').css('color', 'green')
							result = true
						}
					}
				})
			}
			break

			// 密码验证
		case 'pwd':
			let RE = /^\w{6,18}$/
			if (!value.match(RE)) {
				$('#pp').text('* 密码格式不正确!')
				$('#pp').css('color', '#fa2424')
				result = false
			} else {
				$('#pp').text('验证通过!')
				$('#pp').css('color', 'green')
				result = true
			}
			break

			// 密码验证
		case 'repwd':
			let pwd = $('input[name$="pwd"]').val()
			if (value != pwd) {
				$('#rpp').text('* 密码不一致!')
				$('#rpp').css('color', '#fa2424')
				result = false
			} else {
				$('#rpp').text('验证通过!')
				$('#rpp').css('color', 'green')
				result = true
			}
			break
	}
	return result
}

// 表单验证
function chkForm() {
	return check('name') && check('tel') && check('pwd') && check('repwd')
}