App.TaskView = Ember.View.extend({
	task: null,
	templateName: 'task',
	tagName: 'div',
	classNames: ['task'],
	readOnly: false,
	actions: {
		toggleDone: function() {
			this.task.set('done', !this.task.get('done'));
			// FIXME: this assumes no errors occured...
			this.get('controller').send('doneHasChanged', this.task);
		},
		togglePin: function() {
			this.task.set('pinned', !this.task.get('pinned'));
		},
		unlink: function(link) {
			var self = this;
			$.ajax({
				url: '/unlink/'+this.task.id+'/'+link.name,
				type: 'POST',
				dataType: 'json',
			}).done(function(_task) {
				self.task.set('links', _task.links);
			}).fail(function(x) { error('Deleting file', x); });
		},
		alarmTriggered: function() {
			this.task.incrementProperty('triggered');
		},
	},
	dragEnter: function(ev) {
		ev.effectAllowed = 'copy';
		ev.preventDefault();
	},
	dragOver: function(ev) {
		this.$().addClass('accepting');
		ev.preventDefault();
	},
	dragLeave: function(ev) {
		this.$().removeClass('accepting');
		ev.preventDefault();
	},
	drop: function(ev) {
		this.$().removeClass('accepting');
		var data = new FormData();
		var files = ev.dataTransfer.files;
		for (var i = 0; i < files.length; i++) {
			data.append(files[i].name, files[i]);
		}
		var self = this;
		$.ajax({
			url: '/link/'+this.task.id,
			type: 'POST',
			data: data,
			processData: false,
			contentType: false,
			dataType: 'json',
		}).done(function(_task) {
			self.task.set('links', _task.links);
		}).fail(function(x) { error('Uploading file', x); });
		ev.preventDefault();
	},
});
