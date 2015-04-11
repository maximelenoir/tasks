App.ActiveRoute = Ember.Route.extend({
	model: function() {
		return $.ajax({
				url: '/tasks',
				dataType: 'json',
			}).then(function(tasks) {
				return tasks.filter(function(task) { return !task.done; })
						.map(function(task) { return App.Task.create(task); });
		});
	},
});

App.ActiveController = Ember.ArrayController.extend({
	taskName: null,
	sortAscending: true,
	sortProperties: ['pinned', 'alarmOn', 'updatedOn'], // Observes only.
	orderBy: function(tl, tr) {
		var pl = tl.get('pinned');
		var pr = tr.get('pinned');
		if (pl && !pr) {
			return -1;
		} else if (!pl && pr) {
			return 1;
		}
		var al = moment(tl.get('alarmOn'));
		var ar = moment(tr.get('alarmOn'));
		var now = moment();
		if (!al.zero() && al < now && !ar.zero() && ar < now) {
			// Both triggered
			return al < ar ? -1 : 1;
		} else if (!al.zero() && al < now) {
			return -1;
		} else if (!ar.zero() && ar < now) {
			return 1;
		}
		var ul = moment(tl.get('updatedOn'));
		var ur = moment(tr.get('updatedOn'));
		return ul < ur ? 1 : -1;
	},
	actions: {
		newTask: function() {
			if (this.taskName == null) { return; }
			var self = this;
			$.ajax({
				url: '/new',
				dataType: 'json',
			}).done(function(_task) {
				var task = App.Task.create(_task);
				task.set('name', self.taskName);
				self.get('model').pushObject(task);
				self.set('taskName', null);
			}).fail(function(x) { error('New task', x); });
		},
		removeTask: function(task) {
			var self = this;
			task.del().done(function() {
				self.get('model').removeObject(task);
			});
		},
		doneHasChanged: function(task) {
			if (task.get('done')) {
				this.get('model').removeObject(task);
			}	
		},
	},
});
