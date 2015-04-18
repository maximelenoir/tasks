App.IndexRoute = Ember.Route.extend({
	beforeModel: function() {
		this.transitionTo('active');
	},
});

App.ApplicationController = Ember.Controller.extend({
	search: null,
	results: null,
	searching: function() {
		return this.search != null && this.search.length != 0;
	}.property('search'),
	onSearch: function() {
		if (this.search.length == 0) {
			this.set('results', null);
		}
		var self = this;
		$.ajax({
			url: '/search',
			method: 'POST',
			data: JSON.stringify(this.search.split(' ')),
			dataType: 'json',
		}).done(function(tasks) {
			self.set('results', tasks);
		});
	}.observes('search'),
});
