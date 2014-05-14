/* Mutual Variables */
var href_url = 'http://test.poll.tau.wanted.co.il/rpc/controller.php';

/* Student Variables */
var interval_check_end = null; // Interval that checks if class was ended ~~~Student
var q_asked = null; // Used for Fake Questions button
var timer = null; // Timer interval
var elapsed_time_update = null; // Interval to update the elapsed time
var questions_count = -1; // Counts the questions ones, ends class only when 0 and class actually ended
var $question = null; // Stores the next question, if exists
var remaining_questions_timeout = null; // 30 minutes Timeout in case class ended before all questions were shown. Clears when all questions were answered and ends class 
var q_pos = 0; // Used to determine the current position in questions array
var late_entrance = false; // In case user entered after questions timings
var first_second = 0; // Validate that "late entrance" occured only in the first second.
var class_ended = false; // Validates that the class was ended
var already_voted = false; // Checks if user already voted/answered specific question
var half_hour_passed = 30; // Checks if half hour passed since class ENDED
var refresh_couses_interval = null; // Checks for active courses in case no active courses at the moment
var pushNotification;

/* Professor Variables */
var elapsed = null; // Stores the time elapsed ~~~Professor
var class_stoped = false; // Validates that professor stopped the class
var class_interval = null; // Professor's timer interval


function onDeviceReady() {
    $("#app-status-ul").append('<li>deviceready event received</li>');
    
	document.addEventListener("backbutton", function(e)
	{
    	$("#app-status-ul").append('<li>backbutton event received</li>');
		
		if( $("#home").length > 0)
		{
			// call this to get a new token each time. don't call it to reuse existing token.
			//pushNotification.unregister(successHandler, errorHandler);
			e.preventDefault();
			navigator.app.exitApp();
		}
		else
		{
			navigator.app.backHistory();
		}
	}, false);

	try 
	{ 
    	pushNotification = window.plugins.pushNotification;
    	if (device.platform == 'android' || device.platform == 'Android') {
			$("#app-status-ul").append('<li>registering android</li>');
        	pushNotification.register(successHandler, errorHandler, {"senderID":"661780372179","ecb":"onNotificationGCM"});		// required!
		} else {
			$("#app-status-ul").append('<li>registering iOS</li>');
        	pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});	// required!
    	}
    }
	catch(err) 
	{ 
		txt="There was an error on this page.\n\n"; 
		txt+="Error description: " + err.message + "\n\n"; 
		alert(txt); 
	} 
}

// handle APNS notifications for iOS
function onNotificationAPN(e) {
    if (e.alert) {
         $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
         navigator.notification.alert(e.alert);
    }
        
    if (e.sound) {
        var snd = new Media(e.sound);
        snd.play();
    }
    
    if (e.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
    }
}

// handle GCM notifications for Android
function onNotificationGCM(e) {
    $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');
    
    switch( e.event )
    {
        case 'registered':
		if ( e.regid.length > 0 )
		{
			$("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
			// Your GCM push server needs to know the regID before it can push to this device
			// here is where you might want to send it the regID for later use.
			console.log("regID = " + e.regid);
		}
        break;
        
        case 'message':
        	// if this flag is set, this notification happened while we were in the foreground.
        	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
        	if (e.foreground)
        	{
				$("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

				// if the notification contains a soundname, play it.
				var my_media = new Media("/android_asset/www/"+e.soundname);
				my_media.play();
			}
			else
			{	// otherwise we were launched because the user touched a notification in the notification tray.
				if (e.coldstart)
					$("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
				else
				$("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
			}

			$("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
			$("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
        break;
        
        case 'error':
			$("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
        break;
        
        default:
			$("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
        break;
    }
}

function tokenHandler (result) {
    $("#app-status-ul").append('<li>token: '+ result +'</li>');
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
}

function successHandler (result) {
    $("#app-status-ul").append('<li>success:'+ result +'</li>');
}

function errorHandler (error) {
    $("#app-status-ul").append('<li>error:'+ error +'</li>');
}

document.addEventListener('deviceready', onDeviceReady, true);


/* Mutual JS Handlers */
// Login Page
$('#Login_Page').on("pagebeforeshow", function() {
	loading('show');
	if(localStorage.user_id) {
		$(this).hide();
		if(localStorage.user_type == '1') {
			$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page");
		} else {
			$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
		}		
	}
});

$('#login_form').submit(function(e){
	e.preventDefault();
	loading('show');
	user_login();
});

// General
$('.logout').on('click', function(e) {
	$.mobile.loading('show');
	localStorage.clear();
	user_id = null;
	setTimeout(function(){
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
		location.reload(1);
	}, 2000);
});

$('.custom_back_button').on('click',function(e){
	if($('#timer_seeker').css('display') == 'none' && $('#class_not_started').css('display') == 'none'
		&& $('#no_questions_left').css('display') == 'none' && class_ended) {
			
	} else {
		first_second = 0;
	}
});

// Main Page
$('#DashBoard_Page, #DashBoard_Page_Seeker').on("pagebeforeshow", function() {
	$this = $(this);
	loading('show');
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if(localStorage.user_type == '1' && document.URL.indexOf('Seeker') > -1){
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page");
	} else if(localStorage.user_type == '2' && document.URL.indexOf('Seeker') <= -1){
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	} else {
		$('.header_normal h1').html("שלום,<br />" + localStorage.first_name + " " + localStorage.last_name);
		
		if (localStorage.user_type == '1') {
			$(this).not('#DashBoard_Page_Seeker').find('.line_center').html(localStorage.courses).trigger('create');
		} else {
			var action = 'refresh_courses';
			var parameters = {'user_id': localStorage.user_id};
			var json_param = JSON.stringify(parameters);
			var req = new XMLHttpRequest(); // new HttpRequest instance 
			req.open("POST", href_url, false);
			req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					if (req.status == 200 || req.status == 0) {
						var data = JSON.parse(req.responseText);
						if(localStorage.courses === data.courses) {
							localStorage.courses = data.courses;
							$this.find('.line_center').html(localStorage.courses).trigger('create');
							
							if(localStorage.courses.indexOf('class_active') <= -1) {
								refresh_couses_interval = setInterval(function() {
									var action = 'refresh_courses';
									var parameters = {'user_id': localStorage.user_id};
									var json_param = JSON.stringify(parameters);
									var req = new XMLHttpRequest(); // new HttpRequest instance 
									req.open("POST", href_url, false);
									req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
									req.onreadystatechange = function() {
										if (req.readyState == 4) {
											if (req.status == 200 || req.status == 0) {
												var data = JSON.parse(req.responseText);
												if(localStorage.courses != data.courses && data.courses.indexOf('class_active') > -1) {
													if (document.URL.indexOf('class_page') > -1) {
														$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
														clearInterval(refresh_couses_interval);
														refresh_couses_interval = null;
													} else {
														location.reload(1);
													}						
												}
											}
										}
									};
									req.send("action=" + action + "&parameters=" + json_param);
								}, 10000);
							}						
						} else {
							localStorage.courses = data.courses;
							$this.find('.line_center').html(localStorage.courses).trigger('create');

							/* In the future it is possible to add another options, */
							/* e.g. if a class is already active and suddenly another class goes active... */
						}
					}
				}
			};
			req.send("action=" + action + "&parameters=" + json_param);
		}
		
		$('.course_linking').click(function(e) {
			e.preventDefault();
			loading("show");

			localStorage.course_id = $(this).attr('id');
			localStorage.course_name = $(this).attr('name');
			
			if ($(this).find('img').hasClass('class_active')) {
				localStorage.class_active = true;
			} else {
				localStorage.class_active = false;
			}
			
			if (localStorage.user_type == '2') {
				localStorage.class_id = $(this).find('img').attr('id');
				$(':mobile-pagecontainer').pagecontainer('change', "#job_seeker_class_page");
			} else {
				$(':mobile-pagecontainer').pagecontainer('change', "#employer_class_page");
			}
		});
	}
		
	$( document ).on( "swipeleft", "#DashBoard_Page", function( e ) {
		// We check if there is no open panel on the page because otherwise
		// a swipe to close the left panel would also open the right panel (and v.v.).
		// We do this by checking the data that the framework stores on the page element (panel: open).
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel" ).panel( "open" );
			}
		}
	});
});

/* Student JS Handlers */
// Class Page
$('#job_seeker_class_page').on("pagebeforeshow", function() {
	loading('show');
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '1') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page");
	}
	
	// We need to set values and containers to default for each time student enters new class
	$('#time_elapsed_seeker').css('width', 0);
	$('#class_phase_one').removeClass('active');
	$('#class_phase_two').removeClass('active');
	$('#class_phase_three').removeClass('active');
	$('#no_questions_left').hide();
	$('#timer_seeker').hide();	
	q_pos = 0;
	late_entrance = false;
	questions_count = -1;
	var time_l = get_class_time_elapsed(localStorage.class_id);
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	$('.course_name_header').html(localStorage.course_name);
	
	if(localStorage.class_active == 'true') {
		$('#class_not_started').hide();
		$('#active_class_container').show();
		$('#job_seeker_clock').show();
		
		var html = '';
		var action = 'display_questions_for_class';
		var parameters = {'user_id' : localStorage.user_id, 'class_id' : localStorage.class_id};	
		var json_param = JSON.stringify(parameters);
	    var req = new XMLHttpRequest(); // new HttpRequest instance 
		req.open("POST", href_url, true);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {  	
				if (req.status == 200 || req.status == 0) {
					var data = JSON.parse(req.responseText);
					if( data.success) {
						html = data.html;
						timings = data.timings;
						$('#job_seeker_clock').append(html).trigger( "create" );
						q_asked = $('#timer_seeker').next('.seeker_question').attr('id');
						$question = $('#timer_seeker').next('.seeker_question');
						
						if(interval_check_end == null) {
							interval_check_end = setInterval(function() {
								check_for_end_of_class(localStorage.class_id);
							}, 10000);
						}
						
						elapsed_time_update = setInterval(function(){
							time_l = get_class_time_elapsed(localStorage.class_id);
						}, 15000);

						timer = setInterval(function(){
							time_l++;
							start_clock_seeker(time_l, timings);
							time_bar(time_l);
						}, 1000);
						
						$('.clock_container').show();
						$('.class_phase').show();
						$('#class_not_started').hide();
					} else {
						$('#no_questions_left').show();
					}
				}
			}
		};
		req.send("action=" + action + "&parameters=" + json_param);
	} else {
		check_half_hour_since_class_ended();
		if(half_hour_passed >= 30) {
			$('#class_not_started').show();
			$('#active_class_container').hide();
			$('#job_seeker_clock').hide();
			
			if(interval_check_end != null) {
				clearInterval(interval_check_end);
				interval_check_end = null;
			}
			
			if(localStorage.courses.indexOf('class_active') <= -1 && refresh_couses_interval == null) {
				refresh_couses_interval = setInterval(function() {
					var action = 'refresh_courses';
					var parameters = {'user_id': localStorage.user_id};
					var json_param = JSON.stringify(parameters);
					var req = new XMLHttpRequest(); // new HttpRequest instance 
					req.open("POST", href_url, false);
					req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
					req.onreadystatechange = function() {
						if (req.readyState == 4) {
							if (req.status == 200 || req.status == 0) {
								var data = JSON.parse(req.responseText);
								if(localStorage.courses != data.courses && data.courses.indexOf('class_active') > -1) {
									if (document.URL.indexOf('class_page') > -1) {
										$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
										clearInterval(refresh_couses_interval);
										refresh_couses_interval = null;
									} else {
										location.reload(1);
									}						
								}
							}
						}
					};
					req.send("action=" + action + "&parameters=" + json_param);
				}, 10000);
			}
		} else {
			$('#class_not_started').hide();		
			var html = '';
			var action = 'display_questions_for_class';
			var parameters = {'user_id' : localStorage.user_id, 'class_id' : localStorage.class_id};
			var json_param = JSON.stringify(parameters);
		    var req = new XMLHttpRequest(); // new HttpRequest instance 
			req.open("POST", href_url, false);
			req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			req.onreadystatechange = function() {
				if (req.readyState == 4) {  	
					if (req.status == 200 || req.status == 0) {
						var data = JSON.parse(req.responseText);
						if(data.success) {
							// We count the questions here seperatly because the clock was not initiated at all (or if user resets the app)
							questions_count = 0;
							for (var i in data.timings) {
								questions_count++;
							}
							
							remaining_questions_timeout = setTimeout(function() {
								window.location = "#DashBoard_Page_Seeker";
								location.reload(1);
							}, parseInt(30 - half_hour_passed) * 60000);
							html = data.html;
							$('#job_seeker_clock').append(html).trigger( "create" );
							q_asked = $('#timer_seeker').next('.seeker_question').attr('id');
							$question = $('#timer_seeker').next('.seeker_question');
							alert('ההרצאה הסתיימה.\nנותרו ' + parseInt(30 - half_hour_passed) + ' דקות לענות על השאלות הנותרות.');
							$('#active_class_container').show();
							$('.clock_container').show();
							$('.time_element').first().hide();
							$('.class_phase').hide();
							while ($question.attr('id') != undefined && $question.attr('id') != null && $question.attr('id') != '') {
								CheckAlreadyVoted($question.attr('id').replace('q', ''));
								if(!already_voted) {
									$('#timer_seeker').hide();
									changeQustion($question.attr('id'));
								} else {
									$question = $question.next('.seeker_question');
									questions_count--;
								}
							}
							
							if(questions_count <= 0) {
								$('#no_questions_left').show();
							}
						}
					}
				}
			};
			req.send("action=" + action + "&parameters=" + json_param);
		}
	}
});
$('#job_seeker_class_page').on('pagehide', function(){
	if(timer != null) {
		clearInterval(timer);		
		timer = null;		
		clearInterval(elapsed_time_update);
		elapsed_time_update = null;
	}
	$('#timer_seeker').hide();	
	$('#timer_seeker').nextAll().remove();
});

/* Professor JS Handlers */
// Class Page
$(document).on('pagebeforeshow', '#employer_class_page', function(e, data){
	$( document ).on( "swipeleft", "#employer_class_page", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_2" ).panel( "open" );
			}
		}
	});
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	} else if(localStorage.course_id) {
		course_name = localStorage.course_name;
		$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	    $('.course_name_header').html(course_name);	    
		
		var action = 'check_class_initiated';
		var parameters = {'course_id' : localStorage.course_id, 'user_id': localStorage.user_id};
		var json_param = JSON.stringify(parameters);
		var req = new XMLHttpRequest(); // new HttpRequest instance 
		req.open("POST", href_url, false);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				if (req.status == 200 || req.status == 0) {
					var data = JSON.parse(req.responseText);
					if(data.success) {
						class_id = data.success.id;
						elapsed = get_class_time_elapsed(class_id);
						localStorage.class_active = true;
						localStorage.class_id = class_id;
						elapsed_time_update = setInterval(function(){
							elapsed = get_class_time_elapsed(class_id);
						}, 15000);
						class_interval = setInterval(function(){
							elapsed++;
							start_clock('employer_clock', elapsed);
						}, 1000);
						$('#begin_class_container').hide();
						$('.clock_container').show();
						$('#course_name_header').html(localStorage.course_name);
					} else if(!class_stoped) {
						$('#begin_class_container').show();
						$('.clock_container').hide();
						$('#course_name_header').html(localStorage.course_name);
					}
					$.mobile.loading( "hide" );
				}
			}
		};
		req.send("action=" + action + "&parameters=" + json_param);
	}
});
$('#employer_class_page').on('pagehide', function(){
	if(class_interval != null) {
		clearInterval(class_interval);
		class_interval = null;
		clearInterval(elapsed_time_update);
		elapsed_time_update = null;
	}
	$('#class_error').hide();
	$('#class_started').hide();
});

$('#class_start_submit').on('click', function(e) {
	e.preventDefault();	
	//areYouSure("האם להתחיל את השיעור?", "כן", function() {	  			
		loading( 'show');
		var action = 'start_class';
		var parameters = {'course_id' : localStorage.course_id, 'professor_id' : localStorage.user_id, 'course_name' : localStorage.course_name};
		var json_param = JSON.stringify(parameters);
		var req = new XMLHttpRequest(); // new HttpRequest instance 
		req.open("POST", href_url, false);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				if (req.status == 200 || req.status == 0) {
					var data = JSON.parse(req.responseText);
					if(data.success) {
						elapsed = 0;
						class_id = data.class_id;
						localStorage.class_active = true;
						localStorage.class_id = class_id;
						elapsed_time_update = setInterval(function(){
							elapsed = get_class_time_elapsed(class_id);
						}, 15000);
						class_interval = setInterval(function(){
							elapsed++;
							start_clock('employer_clock', elapsed);
						}, 1000);
						$('#begin_class_container').hide();
						$('.clock_container').show();
					} else if(localStorage.class_active == 'true') {
						$('#class_started').show();
					}
					else {
						$('#class_error').show();
					}
					loading( "hide" );
				}
			}
		};
		req.send("action=" + action + "&parameters=" + json_param);
	//});
});

$('#stop_class').on('click', function(e) {
	e.preventDefault(); 
	areYouSure("האם לסיים את השיעור?", "כן", function() {
		var action = 'end_class';
		var parameters = {'class_id' : localStorage.class_id};		
		var json_param = JSON.stringify(parameters);
		var req = new XMLHttpRequest(); // new HttpRequest instance 
		req.open("POST", href_url, false);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {		  	
				if (req.status == 200 || req.status == 0) {
					var data = JSON.parse(req.responseText);
					if(data.success) {
						$('#employer_clock').hide();
						var statistics = get_class_stats();
						build_class_stats('class_ended_employer', statistics);
						//var questions = get_class_questions_stats(class_id);
						//build_class_questions_stats('class_ended', questions);
						if (!statistics/* && !questions*/) {
							$('#class_ended_employer').html('<h3>אין נתונים</h3>');
						}
						$('#class_ended_employer').show();
						class_stoped = true;
						$('#employer_class_page_back').one( "click", function() {
							class_stoped = false;
							localStorage.clear();
							clearInterval(class_interval);
							class_interval = null;
							clearInterval(elapsed_time_update);
							elapsed_time_update = null;
							$('#class_ended_employer').hide();
						});
					} else {
						return false;
					}
				}
			}
		};
		req.send("action=" + action + "&parameters=" + json_param);
	});
});

// Statistics Pages
$('.ranking_container div a').click(function(e) {
	$(this).parent().parent().find('span').not($(this).parent().next()).hide();
	$(this).parent().next('span').fadeToggle(500);
});

$('#ranking').on("pagebeforeshow", function() {
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$(this).on( "swipeleft", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_3" ).panel( "open" );
			}
		}
	});
});

$(document).on('pagebeforeshow', '#ranking_semester', function(e, data){ 
	loading('show');
	$('.paging_pages').html('');
	$('#ranking_semester_accordion').html('');
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$(this).on( "swipeleft", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_5" ).panel( "open" );
			}
		}
	});
});
$(document).on('pageshow', '#ranking_semester', function(e, data){
	var action = 'display_ranking_semester';
	var parameters = {'user_id' : localStorage.user_id};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
				var paging = JSON.parse(req.responseText).paging;
			 	$('#ranking_semester_accordion').html(html);			 	
			 	$( "#ranking_semester_accordion" ).collapsibleset( "refresh" );
			 	paging_pages(paging);
			} else {
				$('#ranking_semester_accordion').html('<h3 style="text-align:center">אין נתונים</h3>');
			}
			loading('hide');
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

$(document).on('pagebeforeshow', '#ranking_semester_average', function(e, data){ 
	loading('show');
	$('#ranking_semester_average_accordion').html('');
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$(this).on( "swipeleft", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_4" ).panel( "open" );
			}
		}
	});
});
$(document).on('pageshow', '#ranking_semester_average', function(e, data){
	var action = 'display_ranking_semester';  
	var parameters = {'user_id' : localStorage.user_id, 'method': 'stats_average'};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
			 	$('#ranking_semester_average_accordion').html(html);			 	
			 	$( "#ranking_semester_average_accordion" ).collapsibleset( "refresh" );
			} else {
				$('#ranking_semester_average_accordion').html('<h3 style="text-align:center">אין נתונים</h3>');
			}
			loading('hide');
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

$(document).on('pagebeforeshow', '#precentage_per_class', function(e, data){ 
	loading('show');
	$('.paging_pages').html('');
	$('#precentage_per_class_accordion').html('');
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$(this).on( "swipeleft", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_6" ).panel( "open" );
			}
		}
	});
});
$(document).on('pageshow', '#precentage_per_class', function(e, data){
	var action = 'display_ranking_semester';
	var parameters = {'user_id' : localStorage.user_id, 'method': 'precentage'};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
				var paging = JSON.parse(req.responseText).paging;
			 	$('#precentage_per_class_accordion').html(html);			 	
			 	$( "#precentage_per_class_accordion" ).collapsibleset( "refresh" );
			 	paging_pages(paging);
			} else {
				$('#precentage_per_class_accordion').html('<h3 style="text-align:center">אין נתונים</h3>');
			}
			loading('hide');
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

$(document).on('pagebeforeshow', '#precentage_per_course', function(e, data){
	loading('show');
	$('#precentage_per_course_accordion').html('');
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$(this).on( "swipeleft", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_7" ).panel( "open" );
			}
		}
	});
});
$(document).on('pageshow', '#precentage_per_course', function(e, data){
	var action = 'display_ranking_semester';  
	var parameters = {'user_id' : localStorage.user_id, 'method': 'precentage_average'};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
			 	$('#precentage_per_course_accordion').html(html);			 	
			 	$( "#precentage_per_course_accordion" ).collapsibleset( "refresh" );
			} else {
				$('#precentage_per_course_accordion').html('<h3 style="text-align:center">אין נתונים</h3>');
			}
			loading('hide');
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

$(document).on('pagebeforeshow', '#questions_semester', function(e, data){ 
	loading('show');
	$('.paging_pages').html('');
	$('#questions_semester_accordion').html('');
	
	if(!localStorage.user_id) {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#Login_Page");
	} else if (localStorage.user_type == '2') {
		$(this).hide();
		$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$(this).on( "swipeleft", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_8" ).panel( "open" );
			}
		}
	});
});
$(document).on('pageshow', '#questions_semester', function(e, data){  
	var html = '';
	var action = 'display_ranking_semester';
	var parameters = {'user_id' : localStorage.user_id, 'method': 'questions_stats'};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
				var paging = JSON.parse(req.responseText).paging;
			 	$('#questions_semester_accordion').html(html);			 	
			 	$( "#questions_semester_accordion" ).collapsibleset( "refresh" );
			 	paging_pages(paging);
			} else {
				$('#questions_semester_accordion').html('<h3 style="text-align:center">אין נתונים</h3>');
			}
			loading('hide');
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

// Questions Module
$('#my_questions').on('pagebeforecreate', function() {
	get_professor_courses();
});
$(document).on('pagebeforeshow', '#my_questions', function(e, data){ 
	loading('show');
	$('#questions_container').html('');
	$('.paging_pages').html('');
	
	if(localStorage.courses.length == 0) {
		$(this).find('.line_center *:not(h3)').hide();
	} else {
		$(this).find('h3').hide();
		
		$(this).find('button').each(function(){
			$(this).on('click',function(){
				$('.questions_page_container').hide();
				$('#' + $(this).attr('id') + "_container").show();
				if($(this).attr('id') == 'questions') {
					$('.paging_pages').show();
				} else {
					$('.paging_pages').hide();
				}
			});
		});
	}
	
	$('.header_normal h1').html(localStorage.first_name + " " + localStorage.last_name);
	
	$( document ).on( "swipeleft", "#my_questions", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft"  ) {
				$( "#emp_panel_9" ).panel( "open" );
			}
		}
	});
});
$(document).on('pageshow', '#my_questions', function(e, data) {  
	var html = '';
	var action = 'display_questions';
	var parameters = {'user_id' : localStorage.user_id};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {	
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
				var paging = JSON.parse(req.responseText).paging;
				$('#questions_container').html(html).trigger('create');
				//$('.edit_fields').parent().css('visibility', 'hidden');
				$('#questions_container').collapsibleset('refresh');				
				if($('#questions_container').html().replace(/\s+/g, '') == '')
				{
					$('#questions_container').html('אין נתונים');
				}
				paging_pages(paging);
			} else {
					$('#new_question_container').show();
					$('#questions_timings_container').hide();
					$('#questions_container').hide();
			}
			loading('hide');
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

$(document).on('change', '#questions_course_select', function(e, data){
	loading('show');
	var course_id = this.value;
	var action = 'display_questions_for_course';
	var parameters = {'course_id' : course_id};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest(); // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var html = JSON.parse(req.responseText).html;
				var paging = JSON.parse(req.responseText).paging;
			 	$('#course_questions_container').html(html).trigger("create");
				$('.paging_pages_timings').html(paging);
			 	$('.paging_pages_timings a').click(function(e){
					var pages = this.id;
					pages = pages.split('_');
					pages = pages[1];
					$('.ui-controlgroup').not('.page_' + parseInt(pages)).hide();
					$('.page_' + parseInt(pages)).show();
					$( "#course_questions_container" ).trigger( "create" );
				});       					
	   	  } else {
		   $('#course_questions_container').html('<h3 style="text-align:center">אין נתונים</h3>');
		  }
		  loading('hide');
	    }
	};
	req.send("action=" + action + "&parameters=" + json_param);
});

$(document).on('change', '#course_questions_container input[type=checkbox]', function(e, data){
	q_id = this.attributes["name"].value.split("_");
	if($(this).prop('checked')) {
		$("#timing_"+q_id[1]+"_container").show();
	}
	else {
		$("#timing_"+q_id[1]+"_container").hide();
	}
});

$(document).on('click', '#update_questions_for_class', function(e, data){
	$('#timing_errors').hide();
	var selcted_answers = {};
	var timings = {};
	var course_id = document.getElementById('questions_course_select').value;
	var q_id = 0;
	var timing_added = true;
	var i = 0;
	$('#course_questions_container input:checked').each(function(){
		var key = 'XYZ' + i;
		q_id = this.attributes["name"].value.split("_");
		t_id = $("#timing_"+q_id[1]).val();
		selcted_answers[key] = q_id[1];
		
		timings[key] = t_id;
		var is_nan = isNaN(parseFloat(t_id));
		var is_finite = isFinite(t_id);
		if(t_id == '' || is_nan != false || is_finite != true || t_id > 999) {
			timing_added = false;
		}
		i++;
	});
	
	if(timing_added == false) {
		$('#timing_errors').show();
	} else {
		loading('show');
		var action = 'insert_queue_questions_for_class';
		var parameters = {'course_id' : course_id, 'question_ids' :selcted_answers, 'timings' : timings};
		var json_param = JSON.stringify(parameters);
		var req = new XMLHttpRequest(); // new HttpRequest instance 
		req.open("POST", href_url, false);
		req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {  	
				if (req.status == 200 || req.status == 0) {
					var data = JSON.parse(req.responseText);
					if( data.success) {
						alert('השאלות עודכנו להרצאה הבאה!');
						$('#questions').click();
					}
					loading('hide');
				}
			}
		};
		req.send("action=" + action + "&parameters=" + json_param);
	}
});

$(document).on('click', '#submit_button', function(e, data){
		var question = encodeURIComponent(document.getElementById('question').value);
		var course_id = document.getElementById('course_select').value;
		var answers ={};
		var answers_count = 0;
		var confirm = true;
		var html = '';
		
		for(var i=0;i<4;i++)
		{
			var key = "XYZ" + answers_count;
			answers[key] = encodeURIComponent(document.getElementById('answer_'+(i+1)).value);
			if(answers[key].length != 0) {
				answers_count++;
			} else {
				delete answers[key];
			}
		}
		
		if(question.length == 0) {
			var confirm = false;
			$('#error_question').show();
			$('#new_question_errors').show();
		}
		else
		{
			$('#error_question').hide();
		}
		
		if(answers_count < 2) {
			var confirm = false;
			$('#error_answers').show();
			$('#new_question_errors').show();
		}
		else
		{
			$('#error_answers').hide();
		}
		
		if(confirm)
		{
			$('#new_question_errors').hide();
			loading('show');
			
			var action = 'insert_new_question';
			var parameters = {'user_id' : localStorage.user_id, 'course_id' : course_id, 'question' : question, 'answers' : answers};
			var json_param = JSON.stringify(parameters);
		    var req = new XMLHttpRequest();   // new HttpRequest instance 
			req.open("POST", href_url, false);
			req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			req.onreadystatechange = function() {
				if (req.readyState == 4) {  	
					if (req.status == 200 || req.status == 0) {
						var data = JSON.parse(req.responseText);
						if( data.success) {
							alert('השאלה נוספה בהצלחה!');
							for(var i=0;i<4;i++)
							{
								document.getElementById('answer_'+(i+1)).value = '';
							}
							document.getElementById('question').value = '';
							document.getElementById('course_select').selectedIndex = 0;
							$('#course_select-button span').html(document.getElementById('course_select').options[0].text);
							
							var html = JSON.parse(req.responseText).html;
							var paging = JSON.parse(req.responseText).paging;
							$('#questions_container').html(html);
							$('#questions_container').collapsibleset('refresh');				
							if($('#questions_container').html().replace(/\s+/g, '') == '')
							{
								$('#questions_container').html('אין נתונים');
							}
							paging_pages(paging);
							$('#questions_container').html(html);
							$( "#questions_container" ).collapsibleset( "refresh" );
							
							document.getElementById("questions_course_select").selectedIndex="0";
							$('#questions_course_select').prev('span').html('בחר קורס');
						}
						loading('hide');
					}
				}
			};
			req.send("action=" + action + "&parameters=" + json_param);
		}
});

/* Mutual Function */
// General
function areYouSure(text1, button, callback) {
  $("#sure .sure-1").text(text1);
  $("#sure .sure-do").text(button).on("click.sure", function() {
    callback();
    $(this).off("click.sure");
  });
  $.mobile.changePage("#sure");
}

function loading(showOrHide) {
	$.mobile.loading(showOrHide);
}

// Login
function user_login() {
	var login_email = $('#login_email').val();
	var action = 'user_login';
	var parameters = {'login_email' : login_email};	
	var json_param = JSON.stringify(parameters);
	var req = new XMLHttpRequest(); 
	req.open("POST", href_url, true);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				data = JSON.parse(req.responseText);
				if(data.success) {
					user_id = data.user_id;					
					first_name = data.first_name;
					last_name = data.last_name;
					name = first_name + " " + last_name;
					for(var i in data) {
						localStorage[i] = data[i];
					}
					$('.header_normal h1').html("שלום,<br />" + name);
					if (data.user_type == 1) {
						$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page");
					} else {
						$(':mobile-pagecontainer').pagecontainer('change',"#DashBoard_Page_Seeker");						
					}
				}
				else {
					$('.error').css("display", "block");
					loading('hide');
				}				
			}
		}
	};	
	req.send("action=" + action + "&parameters=" + json_param);
}

// Class Page
function get_class_time_elapsed(class_id) {
	var time_l = 0;
	var action = 'get_class_time_elapsed';
	var parameters = {'class_id' : class_id};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest();   // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {  	
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				if(data.success) {
					time_l = data.elapsed;
				} else {
					time_l = false;
				}
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
	return time_l;
}

/* Student Functions */
// Timer
function start_clock_seeker(seconds,timings) {
	if(questions_count == -1) { // We count the questions once, then reduce one either on vote or if its time has already passed and it's been already voted
		questions_count++;
		for(var i in timings) {
			questions_count++;
		}
		if(questions_count > 0) {
			$('#timer_seeker').show();
		}
	}
	
	var totalSeconds = seconds;
	var toNextQ = 0;	
	if($question == null) {
		$question = $('#timer_seeker').next('.seeker_question');
		q_pos++;
	}	

	++totalSeconds;	
	
	// Loop timings until relevent timing positioned, in case of late entrance
	if(totalSeconds > timings[q_pos]) {
		while (totalSeconds > timings[q_pos]) {
			CheckAlreadyVoted($question.attr('id').replace('q', ''));
			if(!already_voted) {
				$('#timer_seeker').hide();
				$question.show();
			} else {
				questions_count--;
			}
			q_pos++;
			$question = $question.next('.seeker_question');
		}
	} else if(first_second === 0) {
		first_second = 1;
	}
	
	if (q_pos == 0) { // First question
		if(totalSeconds >= 0 && totalSeconds <= timings[0]) {
			toNextQ = timings[0] - totalSeconds;
			if (toNextQ == 0) {
				changeQustion($question.attr('id'));
			} else if (toNextQ == 120) {
				// Here is going to be Phongeapp Vibration					
			}
			var sec = pad(toNextQ % 60);
			$('#clock > #seconds').html(sec);
			var min = pad(parseInt(toNextQ / 60));
			min = pad(min % 60);
			$('#clock > #minutes').html(min);
			var hour = pad(parseInt(toNextQ / 3600));
			$('#clock > #hour').html(hour);
		}
	} else { // Second question and above
		if(totalSeconds >= timings[q_pos-1] && totalSeconds <= timings[q_pos]) {
			toNextQ = timings[q_pos] - totalSeconds;
			if (toNextQ == 0) {
				changeQustion($question.attr('id'));
			} else if (toNextQ == 120) {
				// Here is going to be Phongeapp Vibration					
			}
			var sec = pad(toNextQ % 60);
			$('#clock > #seconds').html(sec);
			var min = pad(parseInt(toNextQ / 60));
			min = pad(min % 60);
			$('#clock > #minutes').html(min);
			var hour = pad(parseInt(toNextQ / 3600));
			$('#clock > #hour').html(hour);
		}
	}

	if(($question.attr('id') == undefined || $question.attr('id') == null && $question.attr('id') == '')
		&& (questions_count == 0)) {
		clearInterval(timer);
		timer = null;
		clearInterval(elapsed_time_update);
		elapsed_time_update = null;
		$('#timer_seeker').hide();
		$('#no_questions_left').show();
	} // Last question appeared
	
	function pad(val) {
		var valString = val + "";
		if (valString.length < 2) {
			return "0" + valString;
		} else {
			return valString;
		}
	}
}

function time_bar(time_l) {
	var elapsed = time_l / 60;
	var elapsed_bar = time_l / 57.45; // Supposed to be 54, because class is 90 minutes but MAX bar width is 94% and not 100%
	var percentage = elapsed_bar + '%';
	if(elapsed_bar > 94) {
		percentage = '94%';
	}	
	$('#time_elapsed_seeker').css({
		width : percentage
	});
	if (elapsed >= 30 && elapsed <= 60) {
		$('#class_phase_one').removeClass('active');
		$('#class_phase_two').addClass('active');
		$('#class_phase_three').removeClass('active');
	} else if (elapsed > 60) {
		$('#class_phase_one').removeClass('active');
		$('#class_phase_two').removeClass('active');
		$('#class_phase_three').addClass('active');
	} else {
		$('#class_phase_one').addClass('active');
		$('#class_phase_two').removeClass('active');
		$('#class_phase_three').removeClass('active');
	}
}

function check_for_end_of_class(class_id_end) {
	var action = 'check_for_end_of_class';
	var parameters = {'class_id' : class_id_end};
	var json_param = JSON.stringify(parameters);
	var req = new XMLHttpRequest();	// new HttpRequest instance
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				if (data.success) {
					class_ended = true;
					
					clearInterval(timer);
					clearInterval(interval_check_end);
					clearInterval(elapsed_time_update);
					timer = null;
					interval_check_end = null;
					elapsed_time_update = null;					
					
					/* There are 3 cases:
					1. The professor ended the class earlier, meaning not all questions were shown yet.
						->	Show remaining questions, then timeout 30 minutes until actually ending class.
							When all questions are answered, redirect. (it happens in the seeker_vote function)
					2. Class ended normally but not all questions were answered yet.
						->	When all questions are answered, redirect. (it happens in the seeker_vote function)
					3. Class ended normally and all questions were answered.
						-> 	Redirect.
						
						# If student was on mainpage, it reloads. 
					*/
					
					if (window.location.hash.indexOf('job_seeker_class_page') === -1) {
						location.reload(1);
					} else {
						if($question.attr('id') != undefined && $question.attr('id') != null && $question.attr('id') != '') {
							while ($question.attr('id') != undefined && $question.attr('id') != null && $question.attr('id') != '') {
								changeQustion($question.attr('id'));
								//$question = $question.next('.seeker_question');
							}
							alert('ההרצאה הסתיימה.\nלרשותכם כעת 30 דקות לענות על השאלות הנותרות,\nולאחר מכן תועברו למסך הראשי.');
							remaining_questions_timeout = setTimeout(function() {
								$('#active_class_container').hide();
								$('#class_ended').show();
								window.location = "#DashBoard_Page_Seeker";
								location.reload(1);
							}, 60000 * 30);
						} else if(questions_count == 0) {
							$('#active_class_container').hide();
							$('#class_ended').show();
							setTimeout(function() {
								window.location = "#DashBoard_Page_Seeker";
								location.reload(1);
							}, 3000);
						} else {
							alert('ההרצאה הסתיימה.\nלרשותכם כעת 30 דקות לענות על השאלות הנותרות,\nולאחר מכן תועברו למסך הראשי.');
							remaining_questions_timeout = setTimeout(function() {
								$('#active_class_container').hide();
								$('#class_ended').show();
								window.location = "#DashBoard_Page_Seeker";
								location.reload(1);
							}, 60000 * 30);							
						}
					}
				}
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
}

function check_half_hour_since_class_ended() {
	var action = 'check_half_hour_since_class_ended';
	var parameters = {'class_id': localStorage.class_id};
	var json_param = JSON.stringify(parameters);
	var req = new XMLHttpRequest();	// new HttpRequest instance
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				half_hour_passed = data.time_elapsed;				
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
}

// Questions/Votes
function changeQustion(e) {	// Question is hidden only when voted/answered (seeker_vote function)
	if (e) {
		$('#timer_seeker').hide();
		$('#' + e).show();		
		$question = $question.next('.seeker_question');
		q_pos++;
	}
}

function seeker_vote(user_id, q, this_) {
	questions_count--;
	var $current_question = $(this_).parent(); // Stores current question that was voted/answered
	loading('show');
	var vote_val = $('#seeker_question_' + q).val();
	
	// In case of _question_ and not _vote_
	if(vote_val == undefined || vote_val == null) { 
		$('input:radio[name="q_' + q + '_answers"]').each(function(){
			if ($(this).is(':checked')) {
				vote_val = $(this).val();
			}
		});
	}
	
	// If no answer was selected
	if(vote_val == undefined || vote_val == null) {
		alert('יש לבחור תשובה');
		loading('hide');
		return false;				
	}
	
	var action = 'seeker_vote_class';
	var parameters = {'user_id' : localStorage.user_id, 'class_id' : localStorage.class_id, 'vote_val' : vote_val, 'vote_num' : q};
	var json_param = JSON.stringify(parameters);
	var req = new XMLHttpRequest();	// new HttpRequest instance
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				if (data.success) {
					$('#q' + q).hide();
					
					if ($current_question.nextAll().attr('id') != undefined && $current_question.nextAll().attr('id') != null && $current_question.nextAll().attr('id') != ''
						&& ($current_question.nextAll().css('display') == null || $current_question.nextAll().css('display') == 'none')) {
						if($current_question.prevAll().attr('id') != undefined && $current_question.prevAll().attr('id') != null && $current_question.prevAll().attr('id') != '') {
							if($current_question.prevAll().css('display') == null || $current_question.prevAll().css('display') == 'none') {
								$('#timer_seeker').show();
							} else {
								console.log(1);
							}
						} else {
							$('#timer_seeker').show(); // Show only if current question is the only one shown, and not last
						}
					} else {
						console.log($current_question);
					}
					
					/* If class ended and last question was answered -> Redirect
					If last question was answered but professor hadn't ended the class yet,
					it will be ended only via check_for_end_of_class function, when actually ended.
					Meanwhile the studend will be alerted that the questions are finished. */
					if($question.attr('id') == undefined || $question.attr('id') == null || $question.attr('id') == '') {
						if(questions_count == 0) {
							if(remaining_questions_timeout != null) {
								clearTimeout(remaining_questions_timeout);
								$('#active_class_container').hide();
								$('#class_ended').show();
								setTimeout(function() {
									window.location = "#DashBoard_Page_Seeker";
									location.reload(1);
								}, 3000);
							} else {
								alert("תמו השאלות.\nשימו לב, כאשר המרצה יסיים את ההרצאה,\nתועברו למסך הראשי.");
								$('#no_questions_left').show();
							}
						}
					}					
					loading('hide');
				}
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
}

function CheckAlreadyVoted(q_id) {
	var action = 'CheckAlreadyVoted';
	var parameters = {'user_id' : localStorage.user_id, 'q_id': q_id, 'class_id': localStorage.class_id};
	var json_param = JSON.stringify(parameters);
	var req = new XMLHttpRequest();	// new HttpRequest instance
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				already_voted = data.check;
			}
		}
	};
	req.send("action=" + action + "&parameters=" + json_param);
}

/* Professor Functions */
// Statistics Pages
function get_professor_courses() {
	var action = 'get_professor_courses';
	var parameters = {'user_id' : localStorage.user_id};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest();   // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				$('#questions_course_select, #course_select').html(data.html);
				$('#questions_course_select').prepend('<option disabled="disabled" selected="selected">בחר קורס</option>');
			}
		}
	};	
	req.send("action=" + action + "&parameters=" + json_param);
}

function paging_pages(paging) {
	$('.paging_pages').html(paging);
	$('.paging_pages a').first().removeAttr('href');
 	$('.paging_pages a').click(function(e){
 		$('.paging_pages a').attr('href', '#');
 		$(this).removeAttr('href');
		var pages = this.id;
		pages = pages.split('_');
		pages = pages[1];
		$('.ui-collapsible').not('.page_' + parseInt(pages)).hide();
		$('.page_' + parseInt(pages)).show();
		$( "#ranking_semester_accordion" ).collapsibleset( "refresh" );
	});
}

function build_class_stats(e_id, statistics) {
	var html_stats = '';
	for (var vote_arr in statistics) {
		var total_score = 0;
		var count_votes = 0;
		html_stats += '<div style="position:relative;">';
		var name = vote_arr;
		var name_correct = name.replace('דרג את','');
		html_stats += '<h4 class="stats_title">' + name + '</h4>';
		
		for (var i in statistics[vote_arr]) {
			count_votes++;
			total_score += parseInt(statistics[vote_arr][i]['score']);
		}
		var avg_score = Math.round(total_score / count_votes);
		html_stats += '<table style="width:90%; font-weight:bold; margin:auto"><tr><td>0</td><td style="width:100%"><div class="stats_score_container">';
		html_stats += '<div class="stats_score_bar">';
		html_stats += '<div class="stats_score" style="width: ' + avg_score + '%">' + avg_score + '%</div>';
		html_stats += '</div>';
		html_stats += '</div></td><td>100</td></tr></table></div>';
	}
	if(e_id) {
		$('#' + e_id).html(html_stats);
	} else {
		return html_stats;
	}
}

function get_class_stats() {
	var action = 'get_class_stats';
	var parameters = {'class_id' : localStorage.class_id};
	var json_param = JSON.stringify(parameters);
    var req = new XMLHttpRequest();   // new HttpRequest instance 
	req.open("POST", href_url, false);
	req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200 || req.status == 0) {
				var data = JSON.parse(req.responseText);
				if( data.success) {
					class_stats = data.class_stats;
				} else {
					class_stats = false;
				}
			}
		}
	};	
	req.send("action=" + action + "&parameters=" + json_param);
	return class_stats;
}

// Class Page
function start_clock(id, seconds){
    var totalSeconds = seconds;
    setTime();
    
    function setTime()
	{
        ++totalSeconds;
        var sec = pad(totalSeconds%60);
        $('#clock > #seconds').html(sec);
        var min = pad(parseInt(totalSeconds/60));
        if(min > 59) {
        	var hour = pad(parseInt(min / 60));
        	$('#clock > #hour').html(hour);
        	min = pad(parseInt(min%60)); 
        	$('#clock > #minutes').html(min);
        } else {
        	$('#clock > #minutes').html(min);
        	$('#clock > #hour').html('00');
        }
	}
	
    function pad(val)
    {
        var valString = val + "";
        if(valString.length < 2)
        {
            return "0" + valString;
        }
        else
        {
            return valString;
        }
    }
}