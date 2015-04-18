App.TasksRoute = Ember.Route.extend({
	model: function() {
		return $.ajax({
			url: '/tasks',
			dataType: 'json',
		}).then(function(tasks) {
			return tasks.map(function(task) { return App.Task.create(task); });
		});
	},
});


App.TasksController = Ember.ArrayController.extend({
	search: null,
	sortAscending: true,
	sortProperties: ['pinned', 'alarmOn', 'triggered', 'updatedOn', 'done'], // Observes only.
	searching: function() {
		return this.search != null && this.search.length != 0;
	}.property('search'),
	orderBy: function(tl, tr) {
		var dl = tl.get('done');
		var dr = tr.get('done');
		if (dl && !dr) {
			return 1;
		} else if (!dl && dr) {
			return -1;
		}
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
	onSearch: function() {
		if (this.search == null || this.search.length == 0) {
			$('.task').toggleClass('hidden', false);
			return;
		}
		var self = this;
		$.ajax({
			url: '/search',
			method: 'POST',
			data: JSON.stringify(this.search.split(' ')),
			dataType: 'json',
		}).done(function(tasks) {
			if (tasks == null) {
				tasks = [];
			} else {
				tasks = tasks.map(function(task) { return task.id; });
			}
			$('.task').each(function(_, task) {
				task = $(task);
				var id = task.attr('data-task-id');
				task.toggleClass('hidden', tasks.indexOf(id) < 0);
			});
		});
	}.observes('search'),
	actions: {
		newTask: function() {
			if (this.search == null) { return; }
			var self = this;
			$.ajax({
				url: '/new',
				dataType: 'json',
			}).done(function(_task) {
				var task = App.Task.create(_task);
				task.set('name', self.search);
				self.get('model').pushObject(task);
				self.set('search', null);
			}).fail(function(x) { error('New task', x); });
		},
		removeTask: function(task) {
			var self = this;
			task.del().done(function() {
				self.get('model').removeObject(task);
			});
		},
		clearSearch: function(task) {

		},
	},
});
