// IMPORT MODULES under test here:
import CreateUserAccountName from '../app.js';

const test = QUnit.test;



test('time to test a function', function(assert) {
    //Arrange
    // Set up your parameters and expectations
    const name = 'josh';
    const user = CreateUserAccountName(name);

    const result = '"{"name = josh", "recordingSession={}}';

    
    //Assert
    // Make assertions about what is expected valid result
    assert.equal(user, result);
});
