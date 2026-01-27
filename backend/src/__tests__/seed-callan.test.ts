import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import type { CallanData } from '../types/callan-data'

describe('Callan Q&A Seed Data', () => {
  const dataPath = path.join(__dirname, '../data/callan-qa-data.json')
  let data: CallanData

  beforeAll(() => {
    const content = fs.readFileSync(dataPath, 'utf-8')
    data = JSON.parse(content)
  })

  it('loads valid JSON data', () => {
    expect(data).toBeDefined()
    expect(data.stages).toBeDefined()
    expect(Array.isArray(data.stages)).toBe(true)
  })

  it('has 12 stages', () => {
    expect(data.stages).toHaveLength(12)
  })

  it('has stages with required fields', () => {
    for (const stage of data.stages) {
      expect(stage.stage).toBeTypeOf('number')
      expect(stage.title).toBeTypeOf('string')
      expect(stage.description).toBeTypeOf('string')
      expect(Array.isArray(stage.lessons)).toBe(true)
      expect(stage.lessons.length).toBeGreaterThan(0)
    }
  })

  it('has lessons with required fields', () => {
    for (const stage of data.stages) {
      for (const lesson of stage.lessons) {
        expect(lesson.lesson).toBeTypeOf('number')
        expect(lesson.title).toBeTypeOf('string')
        expect(lesson.title.length).toBeGreaterThan(0)
        expect(lesson.description).toBeTypeOf('string')
        expect(Array.isArray(lesson.qaItems)).toBe(true)
        expect(lesson.qaItems.length).toBeGreaterThan(0)
      }
    }
  })

  it('has QA items with required fields', () => {
    for (const stage of data.stages) {
      for (const lesson of stage.lessons) {
        for (const qaItem of lesson.qaItems) {
          expect(qaItem.question).toBeTypeOf('string')
          expect(qaItem.question.length).toBeGreaterThan(0)
          expect(qaItem.answer).toBeTypeOf('string')
          expect(qaItem.answer.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('has exactly 600 QA items (12 stages x 5 lessons x 10 items)', () => {
    let totalQAItems = 0
    for (const stage of data.stages) {
      for (const lesson of stage.lessons) {
        totalQAItems += lesson.qaItems.length
      }
    }
    expect(totalQAItems).toBe(600)
  })

  it('has unique stage numbers in sequential order', () => {
    const stageNumbers = data.stages.map(s => s.stage)
    for (let i = 0; i < stageNumbers.length; i++) {
      expect(stageNumbers[i]).toBe(i + 1)
    }
  })

  it('has lesson titles that include stage information', () => {
    for (const stage of data.stages) {
      for (const lesson of stage.lessons) {
        expect(lesson.title).toContain(`Stage ${stage.stage}`)
      }
    }
  })

  it('has each lesson with 10 QA items', () => {
    for (const stage of data.stages) {
      for (const lesson of stage.lessons) {
        expect(lesson.qaItems).toHaveLength(10)
      }
    }
  })

  it('has each stage with 5 lessons', () => {
    for (const stage of data.stages) {
      expect(stage.lessons).toHaveLength(5)
    }
  })

  describe('Stage 1: Basic Questions', () => {
    it('covers basic "this/that" and "what/where" questions', () => {
      const stage1 = data.stages[0]
      expect(stage1.title).toBe('Basic Questions')
      
      const allQuestions = stage1.lessons.flatMap(l => l.qaItems.map(q => q.question.toLowerCase()))
      expect(allQuestions.some(q => q.includes('what'))).toBe(true)
      expect(allQuestions.some(q => q.includes('this'))).toBe(true)
      expect(allQuestions.some(q => q.includes('where'))).toBe(true)
    })
  })

  describe('Stage 2: Basic Grammar', () => {
    it('covers do/does and present tense', () => {
      const stage2 = data.stages[1]
      expect(stage2.title).toBe('Basic Grammar')
      
      const allQuestions = stage2.lessons.flatMap(l => l.qaItems.map(q => q.question.toLowerCase()))
      expect(allQuestions.some(q => q.includes('do '))).toBe(true)
      expect(allQuestions.some(q => q.includes('does '))).toBe(true)
    })
  })

  describe('Higher stages', () => {
    it('has progressively more advanced content', () => {
      // Later stages should have more complex vocabulary and grammar
      const stage1Questions = data.stages[0].lessons.flatMap(l => l.qaItems.map(q => q.question))
      const stage12Questions = data.stages[11].lessons.flatMap(l => l.qaItems.map(q => q.question))
      
      // Stage 12 questions should be longer on average (more complex)
      const avgStage1Length = stage1Questions.reduce((sum, q) => sum + q.length, 0) / stage1Questions.length
      const avgStage12Length = stage12Questions.reduce((sum, q) => sum + q.length, 0) / stage12Questions.length
      
      expect(avgStage12Length).toBeGreaterThan(avgStage1Length)
    })
  })
})
