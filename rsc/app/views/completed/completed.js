App.CompletedRoute = Ember.Route.extend({
	model: function() {
		return $.getJSON('/tasks').then(function(tasks) {
			return tasks.filter(function(task) { return task.done; })
						.map(function(task) { return App.Task.create(task); });
		});
	},
});

App.CompletedController = Ember.ArrayController.extend({
	actions: {
		doneHasChanged: function(task) {
			if (!task.get('done')) {
				this.get('model').removeObject(task);
			}	
		},
	},
});

