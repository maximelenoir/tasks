Ember.Handlebars.helper('ago', function(stamp) { return moment(stamp).fromNow(); });
Ember.Handlebars.helper('date', function(stamp) { return moment(stamp).format('YYYY-MM-DD'); });
Ember.Handlebars.helper('rich-text', function(text, links) {
	links = (links || []).reduce(function(links, link) {
		links[link.name] = link.href;
		return links;
	}, {});
	var parts = (text || '').split('\n');
	return parts.reduce(function(state, line) {
		var lf = true;
		var wasListing = state.listing;
		line = line
			.replace('=>', '&#x21e8;')
			.replace('->', '&#x2192;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\\./g, function(t) { return etxt(t.slice(1)); })
			.replace(/@[^ ]+\b/g, function(t) {
				var link = t.slice(1);
				if (link in links) {
					return '<span class="label label-default">'+
							'<a href="'+eurl(links[link])+'">'+
								'<span class="glyphicon glyphicon-link"></span> '+
								etxt(link)+
							'</a>'+
							'</span>';
				}
				return t;
			})
			.replace(/^[^*][^ ].*$/, function(t) { state.listing = 0; return t; })
			.replace(/^[*]+ .*$/, function(t) {
				lf = false;
				var level = t.split(/\B/).reduce(function(c, w) {
					if (c.stopped) { return c; }
					if (w == '*') {
						c.count++;
					} else {
						c.stopped = true;
					}
					return c;
				}, { count: 0, stopped: false }).count;
				var prefx = '';
				for (var l = wasListing; l < level; l++) {
					prefx += '<ul>';
				}
				t = prefx + '<li>'+t.slice(level)+'</li>';
				state.listing = level;
				return t;
			})
			.replace(/"""/g, function(t) { t = state.quoting ? '</blockquote>' : '<blockquote>'; state.quoting = !state.quoting; return t; })
			.replace(/[*][*]([^*]+)[*][*]/g, function(t) { return '<b>'+t.slice(2, t.length-2)+'</b>'; })
			.replace(/\/\/([^\/]+)\/\//g, function(t) { return '<i>'+t.slice(2, t.length-2)+'</i>'; })
			.replace(/__([^_]+)__/g, function(t) { return '<u>'+t.slice(2, t.length-2)+'</u>'; })
			.replace(/~~([^~]+)~~/g, function(t) { return '<s>'+t.slice(2, t.length-2)+'</s>'; })
			.replace(/\|\|([^|]+)\|\|/g, function(t) { return '<code>'+t.slice(2, t.length-2)+'</code>'; })
			.replace(/:[)]/g, '&#x1f603;')
			.replace(/:[(]/g, '&#x1f61e;')
			.replace(/;[)]/g, '&#x1f61c;')
			.replace(/^##### .*$/g, function(t) { lf = false; return '<h5>'+t.slice(6)+'</h5>'; })
			.replace(/^#### .*$/g, function(t) { lf = false; return '<h4>'+t.slice(5)+'</h4>'; })
			.replace(/^### .*$/g, function(t) { lf = false; return '<h3>'+t.slice(4)+'</h3>'; })
			.replace(/^## .*$/g, function(t) { lf = false; return '<h2>'+t.slice(3)+'</h2>'; })
			.replace(/^# .*$/g, function(t) { lf = false; return '<h1>'+t.slice(2)+'</h1>'; })
			.replace(/[^ ]+:https?:\/\/[^ <>]+[A-Za-z]/g, function(t) {
				var parts = t.split(':');
				var name = parts[0];
				var url = parts.slice(1).join(':');
				return '<a href="'+url+'">'+etxt(name)+'</a>';
			})
			.replace(/[^"]https?:\/\/[^ <>]+[A-Za-z]/g, function(t) {
				return t[0] +
					'<a href="'+t.slice(1)+'">'+
					etxt(t.slice(1))+
					'</a>';
			})
			.replace(/todo:/i, '<span class="label label-warning">TODO</span>')
			.replace(/fixme:/i, '<span class="label label-danger">FIXME</span>')
			.replace(/^---$/g, function(_) { lf = false; return '<hr/>'; });
		for (var level = wasListing; level > state.listing; level--) {
			state.text += '</ul>';
		}
		state.text += line;
		state.line++;
		if (lf && state.line != parts.length) {
			state.text += '<br/>';
		}
		return state;
	}, {line: 0, text: '', listing: 0, quoting: false}).text;
});

String.prototype.endsWith = function(pattern) {
	var d = this.length - pattern.length;
	return d >= 0 && this.lastIndexOf(pattern) === d;
};

eurl = encodeURIComponent;
etxt = function(txt) {
	var e = '';
	for (var i = 0; i < txt.length; i++) {
		e += '&#x' + txt.charCodeAt(i).toString(16) + ';';
	}
	return e;
}


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
