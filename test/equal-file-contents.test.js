import Muter, {captured} from 'muter';
import {expect} from 'chai';
import EqualFileContents from '../src/equal-file-contents';

describe('Testing EqualFileContents', function() {

  const muter = Muter(console, 'log');

  it(`Class EqualFileContents says 'Hello!'`, captured(muter, function() {
    new EqualFileContents();
    expect(muter.getLogs()).to.equal('Hello!\n');
  }));

});
