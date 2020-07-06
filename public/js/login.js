$(function() {
	$('#reg').css('color', '#fa2424')
	// 跳转注册页
	$('#reg').click(function(e) {
		e.preventDefault()
		window.location.replace('/regPage')
	})
})

// 登录信息验证
function chkForm() {
	let tel = $('input[name$="tel"]').val()
	let pwd = $('input[name$="pwd"]').val()
	let result
	$.ajax({
		async: false,
		type: 'post',
		url: '/check/login',
		data: {
			tel: tel,
			pwd: pwd
		},
		success: function(data, textStatus, xhr) {
			if (data === '0') {
				$('#prompt').text('手机号或密码错误!')
				$('#prompt').css('color', '#fa2424')
				console.log('失败')
				result = false
			} else {
				console.log('成功')
				result = true
			}
		}
	})
	console.log(result)
	return result
}