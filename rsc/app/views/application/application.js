App.ApplicationRoute = Ember.Route.extend({
	model: function() {
		this.transitionTo('tasks');
	},
});
