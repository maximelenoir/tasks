App.Task = Ember.Object.extend({
	id: null,
	createdOn: null,
	alarmOn: null,
	updatedOn: null,
	pinned: null,
	name: null,
	done: null,
	details: 'No description',
	links: null,
	triggered: 0,
	api: function(method) {
		return $.ajax({
			type: 'POST',
			url: method,
			contentType: 'application/json',
			data: JSON.stringify(this),
		});
	},
	save: function() {
		return this.api('/save/'+this.id)
			.fail(function(x) {
				error('Save error', x);
			});
	},
	del: function() {
		return this.api('/delete/'+this.id)
			.fail(function(x) {
				error('Delete error', x);
			});
	},
	onChange: function() {
		this.set('updatedOn', moment());
		this.save();
	}.observes('id', 'createdOn', 'alarmOn', 'pinned', 'name', 'done', 'details'),
});
