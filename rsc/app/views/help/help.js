App.HelpRoute = Ember.Route.extend({
	model: function() {
		return App.Task.create({
			id: 'this_id_a_fake_id_move_on',
			createdOn: moment(),
			alarmOn: zero,
			name: 'Task example title',
			done: false,
			details: [
				'### Introduction',
				'New tasks are created in the ||Active|| view and '+
				'you can view your completed tasks in ||Completed|| view. '+
				'A task is basically defined by its name, here ||Task example title||, '+
				'its status and its description. '+
				'You can edit the name and the description of a task by double-clicking on it.',
			    'Double-clicking this sample will show you the raw version of the description. '+
				'However, the next paragraph will details the possible formatting options.',
				'',
				'### General formatting',
				'A task description usually takes up several lines, added by pressing ||alt+enter||. '+
				'Tasks allows you to input a formatted description.',
				'* Titles are obtained by writing 1 to 5 ||\\#\\ || at the beginning of a line.',
			    '* Bullet points, like this one, are obtained by writing ||\\*\\ || at the beginning of a line. '+
				'Contiguous bullet points markup form a single list. '+
				'Add more ||\\*|| before the space to create nested lists.',
				'* Separator are added with ||\\-\\-\\-|| on a separate line.',
				'* Font can be modified: encapsulate with ||\\*\\*|| for **bold**, '+
				'||\\/\\/|| for //italic//, ||\\_\\_|| for __underline__ and ||\\~\\~|| for ~~strike-through~~. '+
				'You can escape those characters by prefixing with ||\\\\||.',
				'* URLs (http://en.wikipedia.org/wiki/URL) are automatically transformed to anchors. '+
				'An alternative name can also be given by prefixing with ||name:|| like this:http://www.google.com.',
				'* There are automatic mapping from ascii compound to unicode such as =>, ->, :), :( and ;).',
				'* ||todo\\:|| and ||fixme\\:|| outputs colorful labels: todo: and fixme: respectively.',
				'* Use ||\\[ \\] || and ||\\[x\\] || at the beginning of a line to generate checkboxes. '+
				'On click, the description will be automatically changed.',
				'* Put ||\\"\\"\\"|| around text that is a quotation or a code snippet. '+
				'Monospace font is used. Note that this quotation is not inline.',
				'',
				'### Special formatting',
				'||@|| can be used to make an inline anchor to a linked resource @task.pdf.',
			].join('\n'),
			links: [{name: 'task.pdf', href: '/file/this_id_a_fake_id_move_on/task.pdf'}],
		});
	},
	actions: {
		removeTask: function() {},
	},
});


