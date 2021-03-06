App.TaskView = Ember.View.extend({
	task: null,
	templateName: 'task',
	tagName: 'div',
	classNames: ['task'],
	attributeBindings: ['id:data-task-id'],
	readOnly: false,
	tick: null,

	id: function() {
		return this.task.get('id');
	}.property('task.id'),
	completedOn: function() {
		return this.task.get('completedOn');
	}.property('task.completedOn', 'tick'),
	updatedOn: function() {
		return this.task.get('updatedOn');
	}.property('task.updatedOn', 'tick'),
	actions: {
		toggleDone: function() {
			if (this.get('readOnly')) { return; }
			this.task.toggleDone();
			// FIXME: this assumes no errors occured...
			this.get('controller').send('doneHasChanged', this.task);
		},
		togglePin: function() {
			if (this.get('readOnly')) { return; }
			this.task.set('pinned', !this.task.get('pinned'));
		},
		remove: function() {
			if (this.get('readOnly')) { return; }
			this.get('controller').send('removeTask', this.task);
		},
		unlink: function(link) {
			if (this.get('readOnly')) { return; }
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
