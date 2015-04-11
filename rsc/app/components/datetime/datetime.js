App.DatetimeView = Ember.View.extend({
	tagName: 'span',
	classNames: ['glyphicon', 'glyphicon-time', 'clickable'],
	classNameBindings: ['alarmClass'],
	attributeBindings: ['alarmFmt:title'],

	alarmOn: null,
	title: null,
	editing: false,
	container: null,
	alarmtimeout: null,
	revision: 0,

	alarmClass: function() {
		return this.alarmStatus();
	}.property('alarmOn', 'revision'),
	alarmStatus: function() {
		var alarmOn = moment(this.get('alarmOn'));
		var now = moment();
		if (alarmOn.zero()) {
			return 'program';
		} else if (alarmOn < now) {
			return 'triggered';
		}
		return 'programmed';
	},
	alarmFmt: function() {
		var alarmOn = moment(this.get('alarmOn')); 
		var now = moment();
		if (alarmOn.zero()) {
			return 'No alarm set';
		} else if (alarmOn < now) {
			return 'Rang on '+alarmOn.format('MMMM Do YYYY @ HH:mm');
		}
		return 'Programmed for '+alarmOn.format('MMMM Do YYYY @ HH:mm');
	}.property('alarmOn', 'revision'),
	didInsertElement: function() {
		this._super();
		this.setAlarm();
	},
	setAlarm: function() {
		if (this.alarmtimeout) { window.clearTimeout(this.alarmtimeout); }
		var alarmOn = moment(this.get('alarmOn'));
		if (alarmOn.zero()) {
			return;
		}
		var now = moment();
		if (now < alarmOn) {
			var waitFor = (alarmOn - now);
			var self = this;
			this.alarm = window.setTimeout(function() {
				self.incrementProperty('revision');
				new Notification(
					'«' + self.title + '» is due now (' +
					alarmOn.format('MMMM Do YYYY @ HH:mm') + ')'
				);
			}, waitFor);
		}
	}.observes('alarmOn'),
	willDestroy: function() {
		this._super();
		if (this.alarm) { window.clearTimeout(this.alarm); }
		if (this.snooze) { window.clearInterval(this.snooze); }
	},
	done: function() {
		this.container.remove();
		this.set('editing', false);
	},
	click: function() {
		if (this.get('editing')) {
			this.done();
			return;
		}

		if (this.alarmStatus() == 'triggered') {
			this.set('alarmOn', zero);
			return;
		}

		this.set('editing', true);
		var self = this;

		this.container = $('<div></div>')
		.css('position', 'absolute')
		.css('z-index', '2000')
		.addClass('datetimepicker-container')
		.appendTo('body')
		.mouseleave(function() {
			self.done();
		}).datetimepicker({
			todayHighlight: true,
			format: 'yyyy-mm-ddThh:ii',
			minuteStep: 15,
			weekStart: 1,
			startView: 2,
			startDate: new Date(),
			initialDate: new Date(self.get('alarmOn')),
		}).on('changeDate', function(ev) {
			self.done();
			// datetime picker is awful at handling TZ...
			self.set('alarmOn', moment(moment(ev.date).utc().format('YYYY-MM-DDTHH:mm:00')));
		});

		var offset = this.$().offset();
		offset.left -= this.container.width() - 15;
		offset.top += 15;
		this.container.offset(offset);

		$('<div class="text-center"><i class="glyphicon glyphicon-remove remove clickable"></i></div>')
		.appendTo(this.container)
		.click(function() {
			self.done();
			self.set('alarmOn', zero);
		});
	},
});

Ember.Handlebars.helper('datetime', App.DatetimeView);
