Ember.Handlebars.helper('ago', function(stamp) { return moment(stamp).fromNow(); });
Ember.Handlebars.helper('date', function(stamp) { return moment(stamp).format('YYYY-MM-DD'); });

function error(title, x) {
	var message = 'Something went wrong...'
	if (x.responseText !== undefined && x.responseText.length) {
		message = JSON.parse(x.responseText).error
	}
	$.notify({
		icon: 'glyphicon glyphicon-exclamation-sign',
		title: '<b>'+title+'</b>: ',
		message: message,
	}, {
		type: 'danger',
		placement: {
			from: 'bottom',
			align: 'right',
		},
	});
}

zero = moment('0001-01-01T00:00:00Z')
moment.fn['zero'] = function() {
	return this.unix() == zero.unix();
}
