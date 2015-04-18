App = Ember.Application.create({
	LOG_TRANSITIONS: true,
	LOG_BINDINGS: true,
	LOG_VIEW_LOOKUPS: true,
	LOG_STACKTRACE_ON_DEPRECATION: true,
	LOG_VERSION: true,
	debugMode: true,
});

App.deferReadiness();

App.Router.map(function() {
	this.resource('tasks');
	this.resource('help');
});

window.onload = function() {
	var deferreds = [];
	$('script[type="text/x-htmlbars"][src]').each(function(_, script) {
		var url = script.src;
		var paths = url.split('/');
		var name = paths[paths.length-1];
		var id = name.split('.')[0];
		deferreds.push(
			$.ajax({
				url: url,
				dataType: 'text',
			}).done(function(source) {
				Ember.TEMPLATES[id] = Ember.Handlebars.compile(source);
			})
		);
	});

	$.when.apply(null, deferreds).done(function() {
		App.advanceReadiness();
	});
}

if (Notification.permission != "granted") {
	Notification.requestPermission();
}
