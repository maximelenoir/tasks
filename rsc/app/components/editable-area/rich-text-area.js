App.RichTextAreaView = Ember.View.extend({
	tagName: 'div',
	text: null,
	links: null,
	unchecked: null,
	checked: null,
	readOnly: false,
	defaultTemplate: Ember.Handlebars.compile('{{{view.richtext}}}'),
	change: function(ev) {
		var checkbox = $(ev.target);
		var n = checkbox.attr('data-line');
		var lines = this.get('text').split('\n');
		var line = lines[n];
		var checked = checkbox.is(':checked');
		line = line.replace(/^\[.\] .*$/, function(t) {
			return t[0]+(checked ? 'x' : ' ')+t.slice(2);
		});
		lines[n] = line;
		this.set('text', lines.join('\n'));
	},
	richtext: function() {
		return this.transform();
	}.property('text'),
	transform: function() {
		var text = this.get('text');
		var links = this.get('links');
		var ro = this.get('readOnly');
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
				.replace(/\b(https?|ftp):\/\/[0-9a-zA-Z:@\/_%.?&#=-]+/g, function(t) {
					return '<a href="'+t.slice(0)+'">'+
						etxt(t.slice(0))+
						'</a>';
				})
				.replace(/[^ ]+:<a href="([^"]+)">[^<]+<\/a>/g, function(t) {
					var parts = t.split(':');
					var name = parts[0];
					var url = parts.slice(1).join(':').split('>')[0];
					url = url.slice(9, url.length-1);
					return '<a href="'+url+'">'+etxt(name)+'</a>';
				})
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
				.replace(/^.*$/, function(t) {
					if (t.slice(0, 2) != '* ') {
						state.listing = 0;
					}
					return t;
				})
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
				.replace(/^\[ \] .*$/, function(t) {
					return '<input type="checkbox" data-line="'+state.line+'" '+(ro ? 'disabled' : '')+'> '+t.slice(4);
				})
				.replace(/^\[x\] .*$/, function(t) {
					return '<input type="checkbox" data-line="'+state.line+'" checked '+(ro ? 'disabled' : '')+'> <s>'+t.slice(4)+'</s>';
				})
				.replace(/"""/g, function(t) {
					t = state.quoting ? '</blockquote>' : '<blockquote>';
					state.quoting = !state.quoting;
					return t;
				})
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
	},
});

eurl = encodeURIComponent;
etxt = function(txt) {
	var e = '';
	for (var i = 0; i < txt.length; i++) {
		var c = txt.charCodeAt(i);
		e += '&#x' + c.toString(16) + ';';
		if (c == 47) {
			e += '&#8203;';
		}
	}
	return e;
}

Ember.Handlebars.helper('rich-text-area', App.RichTextAreaView);
