var chat_init;
var myScroll;

function getChatPosts(course_id_chat) {
	var action = 'getChatPosts';
	var parameters = {'course_id_chat' : course_id_chat};
 	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
	if (req.readyState == 4) {
		if (req.status == 200 || req.status == 0) {
			var data = JSON.parse(req.responseText);
			if(data.success) {
				var chat_array = data.chat_array;
				if(Object.keys(chat_array).length > 0) {
					$('#chat_empty').hide();
					var chat_container = '';
					for(var i in chat_array) {
						var box_class = 'chat_friend';
						if(localStorage.user_id == chat_array[i].user_id) {
							var box_class = 'chat_personal';	
						}
						chat_container += '<div class="chat_container ' + box_class + '">';	
						chat_container += '<label>';
						chat_container += chat_array[i].user_name;
						chat_container += '</label>';
						chat_container += '<h4>';
						chat_container += chat_array[i].chat_entry;
						chat_container += '</h4>';
						chat_container += '</div>';		      		
					}
						$('#chat_history').html(chat_container);
						$('#chat_history').show();
					} else {
						$('#chat_history').html('');
						$('#chat_empty').show();
					}
				}
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
}

function setChatPosts(course_id_chat, chat_text) {
	var action = 'setChatPosts';
	var parameters = {'course_id_chat' : course_id_chat, 'chat_text' : chat_text, 'user_id' : localStorage.user_id};
 	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				if(data.success) {
					chat_init.chatUpdate();
				}		
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
}

function Chat(course_id) {
	this.course_id_chat = course_id;

	this.chatUpdate = function() {
		loading( "show" );
		var chat_posts = getChatPosts(this.course_id_chat);
		loading( "hide" );
	};
	
	this.chatPost = function(chat_text) {
		loading( "show" );
		var chat_posts = setChatPosts(this.course_id_chat, chat_text);
		loading( "hide" );
	};
}
 $(document).on("popupafteropen", "#chat_job_seeker",function( event, ui ) {
	chat_init = new Chat(localStorage.course_id);
	chat_init.chatUpdate();
	myScroll = new IScroll('#chat_job_seeker-popup', {
		mouseWheel: true,
		scrollbars: false
	});
	//setTimeout(function(){myScroll.refresh(), 3000});
});

$('#submit_post').on('click', function(e) {
	e.preventDefault();
	var chat_text = $('#chat_text').val();
	if (chat_text.length == 0) {
		return false;
	}
	chat_init.chatPost(chat_text);
	$('#chat_text').val('');
});

/* document.addEventListener('touchmove',preventDefaultScrolling,false);

function preventDefaultScrolling(event) {
  event.preventDefault(); //this stops the page from scrolling.
} */